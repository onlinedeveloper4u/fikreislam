import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UploadContext, ActiveUpload } from './UploadContextTypes';
import { useTranslation } from 'react-i18next';
import { deleteFromGoogleDrive } from '@/lib/storage';

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
    const { user, role } = useAuth();

    const updateUpload = useCallback((id: string, updates: Partial<ActiveUpload>) => {
        setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    }, []);

    const uploadContent = useCallback(async (formData: any, mainFile: File, coverFile: File | null) => {
        if (!user) {
            toast.error("You must be logged in to upload content");
            return;
        }

        const uploadId = crypto.randomUUID();
        const startTime = Date.now();

        const newUpload: ActiveUpload = {
            id: uploadId,
            fileName: mainFile.name,
            title: formData.title,
            progress: 0,
            status: 'preparing',
            startTime,
        };

        setActiveUploads(prev => [newUpload, ...prev]);

        try {
            let fileUrlPath = '';
            let coverUrlPath = '';

            // 1. Upload main file
            updateUpload(uploadId, { status: 'uploading', progress: 10 });

            const fileName = mainFile.name;

            if (formData.useGoogleDrive) {
                // Google Drive Upload Flow
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onload = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        resolve(base64);
                    };
                });
                reader.readAsDataURL(mainFile);
                const base64Data = await base64Promise;

                // Build folder path: for audio → Speaker / Category, for others → type name
                let folderPath = formData.contentType; // default: 'book', 'audio', 'video'
                if (formData.contentType === 'audio') {
                    const speakerName = (formData.speaker || '').trim();
                    const cats = formData.categoriesValue
                        ? formData.categoriesValue.split(',').map((c: string) => c.trim()).filter(Boolean)
                        : [];
                    const categoryName = cats[0] || ''; // Use first category as folder

                    if (speakerName) {
                        folderPath = categoryName
                            ? `${speakerName}/${categoryName}`
                            : speakerName;
                    }
                }

                const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'upload',
                        fileName: fileName,
                        contentType: mainFile.type,
                        base64: base64Data,
                        folderPath: folderPath,
                    }),
                });

                try {
                    const result = await response.json();
                    if (result.status === 'success' && result.fileId) {
                        fileUrlPath = `google-drive://${result.fileId}`;
                    } else {
                        fileUrlPath = `google-drive://${fileName}`; // Fallback with original name
                    }
                } catch (e) {
                    console.warn('Could not parse GAS response, falling back to original name-based URL.');
                    fileUrlPath = `google-drive://${fileName}`;
                }

                updateUpload(uploadId, { progress: 50 });
            } else {
                // Supabase Upload Flow
                const filePath = `${formData.contentType}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('content-files')
                    .upload(filePath, mainFile);

                if (uploadError) throw uploadError;
                fileUrlPath = filePath;
                updateUpload(uploadId, { progress: 50 });
            }

            // 2. Upload cover if exists
            if (coverFile) {
                updateUpload(uploadId, { status: 'uploading', progress: 60 });
                const coverExt = coverFile.name.split('.').pop();
                const coverName = `${crypto.randomUUID()}.${coverExt}`;
                const coverPath = `covers/${coverName}`;

                const { error: coverError } = await supabase.storage
                    .from('content-files')
                    .upload(coverPath, coverFile);

                if (coverError) throw coverError;
                coverUrlPath = coverPath;
            }

            updateUpload(uploadId, { progress: 80, status: 'database' });

            // 2.5 Ensure taxonomies exist
            const insertTaxonomy = async (type: "speaker" | "language" | "audio_type" | "category", name: string) => {
                if (!name) return;
                try {
                    // Use upsert with onConflict to avoid 409 Conflict errors in the console
                    const { error } = await supabase
                        .from('taxonomies')
                        .upsert({ type, name }, { onConflict: 'type,name', ignoreDuplicates: true });

                    if (error) {
                        // ignore 23505 just in case, though upsert should handle it
                        if (error.code !== '23505') console.warn('Taxonomy upsert error:', error);
                    }
                } catch (err) {
                    console.debug('Taxonomy entry already exists or error occurred, skipping:', name);
                }
            };

            if (formData.contentType === 'audio') {
                await insertTaxonomy('speaker', formData.speaker);
                await insertTaxonomy('audio_type', formData.audioType);
                const cats = formData.categoriesValue ? formData.categoriesValue.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
                for (const c of cats) await insertTaxonomy('category', c);
            }
            await insertTaxonomy('language', formData.language);

            // 3. Create database record
            const contentPayload: any = {
                title: formData.title,
                description: formData.description,
                author: formData.author,
                type: formData.contentType,
                language: formData.language,
                tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
                file_url: fileUrlPath,
                cover_image_url: coverUrlPath || null,
                status: 'approved',
                published_at: new Date().toISOString(),
                contributor_id: user.id,
            };

            // Only add audio-specific fields if it's an audio upload
            if (formData.contentType === 'audio') {
                Object.assign(contentPayload, {
                    duration: formData.duration || null,
                    venue: formData.venue || null,
                    speaker: formData.speaker || null,
                    audio_type: formData.audioType || null,
                    categories: formData.categoriesValue ? formData.categoriesValue.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
                    lecture_date_gregorian: formData.gDate || null,
                    hijri_date_day: formData.hDay ? parseInt(formData.hDay) : null,
                    hijri_date_month: formData.hMonth ? formData.hMonth.toString() : null,
                    hijri_date_year: formData.hYear ? parseInt(formData.hYear) : null,
                });
            }

            const { error: dbError } = await supabase
                .from('content')
                .insert(contentPayload);

            if (dbError) throw dbError;

            updateUpload(uploadId, { progress: 100, status: 'completed' });
            toast.success(t('dashboard.upload.completed', { title: formData.title, defaultValue: `Upload completed: ${formData.title}` }));

        } catch (err: any) {
            console.error('Background upload error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
            toast.error(t('dashboard.upload.failed', { title: formData.title, defaultValue: `Upload failed: ${formData.title}` }));
        }
    }, [user, role, updateUpload]);

    const editContent = useCallback(async (
        contentId: string,
        currentStatus: string,
        updatePayload: any,
        newMainFile: File | null,
        newCoverFile: File | null,
        contentTitle: string,
        currentFileUrl: string | null,
        contentType: string
    ) => {
        if (!user) {
            toast.error(t('dashboard.upload.validation.errorNotLoggedIn', { defaultValue: 'User not logged in' }));
            return;
        }

        const uploadId = crypto.randomUUID();
        const startTime = Date.now();

        const newUpload: ActiveUpload = {
            id: uploadId,
            fileName: newMainFile ? newMainFile.name : contentTitle,
            title: updatePayload.title,
            progress: 0,
            status: 'preparing',
            startTime,
        };

        setActiveUploads(prev => [newUpload, ...prev]);

        try {
            let fileUrlPath = currentFileUrl;
            let coverUrlPath = updatePayload.cover_image_url; // From existing payload construction if no new cover

            // 1. Upload new main file if provided
            if (newMainFile) {
                updateUpload(uploadId, { status: 'uploading', progress: 10 });
                const fileName = newMainFile.name;

                // Simple check for if we should use Google Drive (audio usually uses GD)
                const useGDrive = contentType === 'audio';

                if (useGDrive) {
                    const reader = new FileReader();
                    const base64Promise = new Promise<string>((resolve) => {
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    });
                    reader.readAsDataURL(newMainFile);
                    const base64Data = await base64Promise;

                    let folderPath = contentType;
                    if (contentType === 'audio') {
                        const speakerName = (updatePayload.speaker || '').trim();
                        const cats = updatePayload.categories || [];
                        const categoryName = cats[0] || '';
                        if (speakerName) {
                            folderPath = categoryName ? `${speakerName}/${categoryName}` : speakerName;
                        }
                    }

                    const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({
                            action: 'upload',
                            fileName: fileName,
                            contentType: newMainFile.type,
                            base64: base64Data,
                            folderPath: folderPath,
                        }),
                    });

                    const result = await response.json();
                    if (result.status === 'success' && result.fileId) {
                        fileUrlPath = `google-drive://${result.fileId}`;
                    } else {
                        throw new Error(result.error || result.message || 'Google Drive upload failed');
                    }

                    // Strict Deletion of old file if it was Google Drive
                    if (currentFileUrl?.startsWith('google-drive://')) {
                        const success = await deleteFromGoogleDrive(currentFileUrl);
                        if (!success) {
                            throw new Error('Failed to delete old Google Drive file. Edit aborted for safety.');
                        }
                    }
                } else {
                    const filePath = `${contentType}/${fileName}`;
                    const { error: uploadError } = await supabase.storage
                        .from('content-files')
                        .upload(filePath, newMainFile);
                    if (uploadError) throw uploadError;
                    fileUrlPath = filePath;
                }
                updateUpload(uploadId, { progress: 50 });
            } else if (currentFileUrl?.startsWith('google-drive://') && contentTitle !== updatePayload.title) {
                // Rename in Drive if title changed and no new file was provided
                updateUpload(uploadId, { status: 'uploading', progress: 30 });
                const fileId = currentFileUrl.replace('google-drive://', '');
                const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'rename',
                        fileId: fileId,
                        newName: updatePayload.title
                    }),
                });
                const result = await response.json();
                if (result.status !== 'success') {
                    throw new Error(result.error || result.message || 'Failed to rename Google Drive file');
                }
                updateUpload(uploadId, { progress: 50 });
            }

            // 2. Upload new cover if provided
            if (newCoverFile) {
                updateUpload(uploadId, { status: 'uploading', progress: 60 });
                const coverExt = newCoverFile.name.split('.').pop();
                const coverName = `${crypto.randomUUID()}.${coverExt}`;
                const coverPath = `covers/${coverName}`;

                const { error: coverError } = await supabase.storage
                    .from('content-files')
                    .upload(coverPath, newCoverFile);

                if (coverError) throw coverError;
                coverUrlPath = coverPath;
            }

            updateUpload(uploadId, { progress: 80, status: 'database' });

            // 2.5 Ensure taxonomies exist (Added for edit persistence)
            const insertTaxonomy = async (type: "speaker" | "language" | "audio_type" | "category", name: string) => {
                if (!name) return;
                try {
                    // Use upsert with onConflict to avoid 409 Conflict errors in the console
                    const { error } = await supabase
                        .from('taxonomies')
                        .upsert({ type, name }, { onConflict: 'type,name', ignoreDuplicates: true });

                    if (error && error.code !== '23505') console.warn('Taxonomy edit upsert error:', error);
                } catch (err) {
                    console.debug('Taxonomy entry already exists or error occurred, skipping:', name);
                }
            };

            if (contentType === 'audio') {
                if (updatePayload.speaker) await insertTaxonomy('speaker', updatePayload.speaker);
                if (updatePayload.audio_type) await insertTaxonomy('audio_type', updatePayload.audio_type);
                const cats = updatePayload.categories || [];
                for (const c of cats) await insertTaxonomy('category', c);
            }
            if (updatePayload.language) await insertTaxonomy('language', updatePayload.language);

            // 3. Update database record
            const finalPayload = {
                ...updatePayload,
                file_url: fileUrlPath,
                cover_image_url: coverUrlPath,
            };

            const { error: dbError } = await supabase
                .from('content')
                .update(finalPayload)
                .eq('id', contentId);

            if (dbError) throw dbError;

            updateUpload(uploadId, { progress: 100, status: 'completed' });

            const message = currentStatus === 'rejected'
                ? t('dashboard.upload.resubmitSuccess', { defaultValue: 'Content resubmitted successfully' })
                : t('dashboard.upload.editSuccess', { defaultValue: 'Content updated successfully' });
            toast.success(message);

        } catch (err: any) {
            console.error('Background edit error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
            toast.error(t('dashboard.upload.editFailed', { title: updatePayload.title, defaultValue: `Update failed: ${updatePayload.title}` }));
        }
    }, [user, role, updateUpload]);

    const clearCompleted = useCallback(() => {
        setActiveUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'error'));
    }, []);

    return (
        <UploadContext.Provider value={{ activeUploads, uploadContent, editContent, clearCompleted }}>
            {children}
        </UploadContext.Provider>
    );
};
