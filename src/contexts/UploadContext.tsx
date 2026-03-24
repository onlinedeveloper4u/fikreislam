"use client";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UploadContext, ActiveUpload } from './UploadContextTypes';
import { deleteFromGoogleDrive } from '@/lib/storage';
import { uploadToInternetArchive, deleteFromInternetArchive } from '@/lib/internetArchive';

const STORAGE_KEY = 'fikreislam_active_uploads';

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user, role } = useAuth();
    const abortControllers = useRef<Record<string, AbortController>>({});

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as ActiveUpload[];
                // Mark previously active uploads as interrupted
                const restored = parsed.map(u =>
                    (u.status === 'uploading' || u.status === 'preparing' || u.status === 'database' || u.status === 'deleting')
                        ? { ...u, status: 'interrupted' as const }
                        : u
                );
                setActiveUploads(restored);
            } catch (e) {
                console.error('Failed to parse saved uploads', e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Keep localStorage in sync
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeUploads));
        }
    }, [activeUploads, isInitialized]);

    const updateUpload = useCallback((id: string, updates: Partial<ActiveUpload>) => {
        setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    }, []);

    const cancelUpload = useCallback((id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
            delete abortControllers.current[id];
        }
        setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'cancelled' as const } : u));
        toast.info("Action cancelled");
    }, []);

    const uploadContent = useCallback(async (formData: any, mainFile: File, coverFile: File | null) => {
        if (!user) {
            toast.error("You must be logged in to upload content");
            return;
        }

        const uploadId = crypto.randomUUID();
        const startTime = Date.now();
        const controller = new AbortController();
        abortControllers.current[uploadId] = controller;

        const newUpload: ActiveUpload = {
            id: uploadId,
            fileName: mainFile.name,
            title: formData.title,
            progress: 0,
            status: 'preparing',
            startTime,
            type: 'upload'
        };

        setActiveUploads(prev => [newUpload, ...prev]);

        try {
            let fileUrlPath = '';
            let coverUrlPath = '';

            // 1. Upload main file
            updateUpload(uploadId, { status: 'uploading', progress: 10 });

            const fileName = mainFile.name;
            const storageProvider = formData.storageProvider || (formData.useGoogleDrive ? 'google-drive' : 'supabase');

            if (storageProvider === 'internet-archive') {
                // Internet Archive Upload Flow
                if (controller.signal.aborted) throw new Error('Aborted');

                const iaResult = await uploadToInternetArchive(
                    mainFile,
                    {
                        speaker: formData.speaker,
                        audioType: formData.audioType,
                        title: formData.title,
                    },
                    controller.signal
                );

                fileUrlPath = iaResult.iaUrl;
                updateUpload(uploadId, { progress: 50 });

            } else if (storageProvider === 'google-drive' || formData.useGoogleDrive) {
                // Google Drive Upload Flow
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                });
                reader.readAsDataURL(mainFile);
                const base64Data = await base64Promise;

                if (controller.signal.aborted) throw new Error('Aborted');

                let folderPath = formData.contentType;
                let googleFolderId = null;
                if (formData.contentType === 'audio') {
                    const speakerName = (formData.speaker || '').trim();
                    const audioType = (formData.audioType || '').trim();

                    if (speakerName) {
                        // Try to get folder ID from speakers and audio_types tables
                        const { data: speaker } = await supabase
                            .from('speakers')
                            .select('id, google_folder_id')
                            .eq('name', speakerName)
                            .maybeSingle();

                        let audioTypeData = null;
                        if (speaker?.id && audioType) {
                            const { data } = await supabase
                                .from('audio_types')
                                .select('google_folder_id')
                                .eq('name', audioType)
                                .eq('speaker_id', speaker.id)
                                .maybeSingle();
                            audioTypeData = data;
                        }

                        if (audioTypeData?.google_folder_id) {
                            googleFolderId = audioTypeData.google_folder_id;
                        } else {
                            folderPath = audioType ? `فکر اسلام/${speakerName}/${audioType}` : `فکر اسلام/${speakerName}`;
                            googleFolderId = null;
                        }
                    }
                }

                const response = await fetch(process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'upload',
                        fileName: fileName,
                        contentType: mainFile.type,
                        base64: base64Data,
                        folderPath: folderPath,
                        folderId: googleFolderId
                    }),
                    signal: controller.signal
                });

                const result = await response.json();
                if (result.status === 'success' && result.fileId) {
                    fileUrlPath = `google-drive://${result.fileId}`;
                } else {
                    fileUrlPath = `google-drive://${fileName}`;
                }

                updateUpload(uploadId, { progress: 50 });
            } else {
                // Supabase Upload Flow
                const filePath = `${formData.contentType}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('content-files')
                    .upload(filePath, mainFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                fileUrlPath = filePath;
                updateUpload(uploadId, { progress: 50 });
            }

            if (controller.signal.aborted) throw new Error('Aborted');

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

            if (controller.signal.aborted) throw new Error('Aborted');
            updateUpload(uploadId, { progress: 80, status: 'database' });

            // 2.5 Ensure metadata records exist
            const insertMetadata = async (type: "speaker" | "language" | "audio_type" | "category", name: string, parentSpeakerId?: string) => {
                if (!name) return null;
                const tableName = type === 'audio_type' ? 'audio_types' : (type === 'speaker' ? 'speakers' : (type === 'language' ? 'languages' : (type === 'category' ? 'categories' : null)));
                if (!tableName) return null;

                try {
                    let payload: any = { name };
                    let conflictTarget = 'name';

                    if (type === 'audio_type' && parentSpeakerId) {
                        payload.speaker_id = parentSpeakerId;
                        // Use a custom conflict logic since Prisma/Supabase upsert on composite keys needs precise handling
                        const { data: existing } = await supabase
                            .from('audio_types')
                            .select('id')
                            .eq('name', name)
                            .eq('speaker_id', parentSpeakerId)
                            .maybeSingle();

                        if (existing) return existing.id;

                        const { data: inserted, error } = await supabase
                            .from('audio_types')
                            .insert([payload])
                            .select('id')
                            .single();

                        if (error) console.warn(`Metadata (audio_types) insert error:`, error);
                        return inserted?.id || null;
                    }

                    const { data, error } = await supabase
                        .from(tableName as any)
                        .upsert(payload, { onConflict: conflictTarget })
                        .select('id')
                        .maybeSingle();

                    if (error && error.code !== '23505') console.warn(`Metadata (${tableName}) upsert error:`, error);
                    return data?.id || null;
                } catch (err) {
                    console.debug('Metadata record already exists or failed:', err);
                    return null;
                }
            };

            let currentSpeakerId = null;
            if (formData.contentType === 'audio') {
                currentSpeakerId = await insertMetadata('speaker', formData.speaker);
                if (currentSpeakerId) {
                    await insertMetadata('audio_type', formData.audioType, currentSpeakerId);
                }
                const catsRaw = formData.categoriesValue || [];
                const cats = Array.isArray(catsRaw) ? catsRaw : (typeof catsRaw === 'string' ? catsRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
                for (const c of cats) await insertMetadata('category', c);
            }
            await insertMetadata('language', formData.language);

            // 3. Create database record
            const contentPayload: any = {
                title: formData.title,
                description: formData.description,
                author: formData.author,
                type: formData.contentType,
                language: formData.language,
                tags: Array.isArray(formData.tags) ? formData.tags : (formData.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || []),
                file_url: fileUrlPath,
                file_size: mainFile.size,
                cover_image_url: coverUrlPath || null,
                status: 'approved',
                published_at: new Date().toISOString(),
                contributor_id: user.id,
            };

            if (formData.contentType === 'audio') {
                Object.assign(contentPayload, {
                    duration: formData.duration || null,
                    venue: formData.venue || null,
                    speaker: formData.speaker || null,
                    audio_type: formData.audioType || null,
                    categories: Array.isArray(formData.categoriesValue) ? formData.categoriesValue : (formData.categoriesValue?.split(',').map((c: string) => c.trim()).filter(Boolean) || []),
                    lecture_date_gregorian: formData.gDate || null,
                    hijri_date_day: formData.hDay ? parseInt(formData.hDay) : null,
                    hijri_date_month: formData.hMonth ? formData.hMonth.toString() : null,
                    hijri_date_year: formData.hYear ? parseInt(formData.hYear) : null,
                });
            }

            const { error: dbError } = await supabase.from('content').insert(contentPayload);
            if (dbError) throw dbError;

            updateUpload(uploadId, { progress: 100, status: 'completed' });
            toast.success(`شامل مکمل: ${formData.title}`);

        } catch (err: any) {
            if (err.name === 'AbortError' || err.message === 'Aborted') {
                console.log('Upload aborted');
                return;
            }
            console.error('Background upload error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
            toast.error(`شامل کرنے میں ناکامی: ${formData.title}`);
        } finally {
            delete abortControllers.current[uploadId];
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
            toast.error("آپ کا داخل ہونا (لاگ ان) ضروری ہے");
            return;
        }

        const uploadId = crypto.randomUUID();
        const startTime = Date.now();
        const controller = new AbortController();
        abortControllers.current[uploadId] = controller;

        const newUpload: ActiveUpload = {
            id: uploadId,
            fileName: newMainFile ? newMainFile.name : contentTitle,
            title: updatePayload.title,
            progress: 0,
            status: 'preparing',
            startTime,
            type: 'edit'
        };

        setActiveUploads(prev => [newUpload, ...prev]);

        try {
            let fileUrlPath = currentFileUrl;
            let coverUrlPath = updatePayload.cover_image_url;

            if (newMainFile) {
                updatePayload.file_url = fileUrlPath;
                updatePayload.file_size = newMainFile.size;
                updateUpload(uploadId, { status: 'uploading', progress: 10 });
                const fileName = newMainFile.name;

                // Determine storage provider: use passed value, or infer from existing URL, or default
                const storageProvider = updatePayload._storageProvider ||
                    (currentFileUrl?.startsWith('ia://') ? 'internet-archive' :
                        currentFileUrl?.startsWith('google-drive://') ? 'google-drive' :
                            (contentType === 'audio' ? 'internet-archive' : 'supabase'));

                if (storageProvider === 'internet-archive') {
                    // Internet Archive Upload Flow
                    if (controller.signal.aborted) throw new Error('Aborted');

                    const iaResult = await uploadToInternetArchive(
                        newMainFile,
                        {
                            speaker: updatePayload.speaker,
                            audioType: updatePayload.audio_type,
                            title: updatePayload.title,
                        },
                        controller.signal
                    );

                    fileUrlPath = iaResult.iaUrl;

                    // Delete old file from its original storage
                    if (currentFileUrl?.startsWith('google-drive://')) {
                        await deleteFromGoogleDrive(currentFileUrl);
                    } else if (currentFileUrl?.startsWith('ia://')) {
                        await deleteFromInternetArchive(currentFileUrl);
                    }

                } else if (storageProvider === 'google-drive') {
                    const reader = new FileReader();
                    const base64Promise = new Promise<string>((resolve, reject) => {
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = reject;
                    });
                    reader.readAsDataURL(newMainFile);
                    const base64Data = await base64Promise;

                    if (controller.signal.aborted) throw new Error('Aborted');

                    let folderPath = contentType;
                    let googleFolderId = null;

                    if (contentType === 'audio') {
                        const speakerName = (updatePayload.speaker || '').trim();
                        const audioTypeName = (updatePayload.audio_type || '').trim();

                        if (speakerName) {
                            const [{ data: speaker }, { data: audioTypeData }] = await Promise.all([
                                supabase.from('speakers').select('google_folder_id').eq('name', speakerName).maybeSingle(),
                                supabase.from('audio_types').select('google_folder_id').eq('name', audioTypeName).maybeSingle()
                            ]);

                            if (audioTypeData?.google_folder_id) {
                                googleFolderId = audioTypeData.google_folder_id;
                            } else if (speaker?.google_folder_id) {
                                googleFolderId = speaker.google_folder_id;
                                folderPath = audioTypeName ? `${audioTypeName}` : '';
                            } else {
                                folderPath = audioTypeName ? `${speakerName}/${audioTypeName}` : speakerName;
                            }
                        }
                    }

                    const response = await fetch(process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({
                            action: 'upload',
                            fileName: fileName,
                            contentType: newMainFile.type,
                            base64: base64Data,
                            folderPath: folderPath,
                            folderId: googleFolderId
                        }),
                        signal: controller.signal
                    });

                    const result = await response.json();
                    if (result.status === 'success' && result.fileId) {
                        fileUrlPath = `google-drive://${result.fileId}`;
                    } else {
                        throw new Error('Google Drive upload failed');
                    }

                    // Delete old file from its original storage
                    if (currentFileUrl?.startsWith('google-drive://')) {
                        await deleteFromGoogleDrive(currentFileUrl);
                    } else if (currentFileUrl?.startsWith('ia://')) {
                        await deleteFromInternetArchive(currentFileUrl);
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
            } else if (contentType === 'audio' && currentFileUrl?.startsWith('google-drive://')) {
                // If no new file is uploaded but metadata changed, check if we need to move the file
                const fileId = currentFileUrl.replace('google-drive://', '');

                // Get the old content record to compare
                const { data: oldContent } = await supabase
                    .from('content')
                    .select('speaker, audio_type')
                    .eq('id', contentId)
                    .single();

                const oldSpeaker = oldContent?.speaker || '';
                const oldAudioType = oldContent?.audio_type || '';
                const newSpeaker = (updatePayload.speaker || '').trim();
                const newAudioType = (updatePayload.audio_type || '').trim();

                if (oldSpeaker !== newSpeaker || oldAudioType !== newAudioType) {
                    updateUpload(uploadId, { status: 'uploading', progress: 30 }); // Reusing status for UI

                    let folderPath = 'audio';
                    let googleFolderId = null;

                    if (newSpeaker) {
                        const { data: speaker } = await supabase.from('speakers').select('id, google_folder_id').eq('name', newSpeaker).maybeSingle();

                        let audioTypeData = null;
                        if (speaker?.id && newAudioType) {
                            const { data } = await supabase.from('audio_types').select('google_folder_id').eq('name', newAudioType).eq('speaker_id', speaker.id).maybeSingle();
                            audioTypeData = data;
                        }

                        if (audioTypeData?.google_folder_id) {
                            googleFolderId = audioTypeData.google_folder_id;
                        } else {
                            const newPath = newAudioType ? `فکر اسلام/${newSpeaker}/${newAudioType}` : `فکر اسلام/${newSpeaker}`;
                            const { createFolderInGoogleDrive } = await import('@/lib/storage');
                            const createResult = await createFolderInGoogleDrive(newPath);
                            if (createResult.success && createResult.folderId) {
                                googleFolderId = createResult.folderId;
                            } else {
                                toast.error('Could not create destination folder in Google Drive.');
                            }
                        }
                    }

                    if (googleFolderId) {
                        const { moveFileInGoogleDrive } = await import('@/lib/storage');
                        const moveResult = await moveFileInGoogleDrive(fileId, googleFolderId);
                        if (!moveResult.success) {
                            console.error('Failed to move file in Google Drive:', moveResult.message);
                            toast.error('Could not move file to new folder in Google Drive.');
                        }
                    }
                }
            }

            if (controller.signal.aborted) throw new Error('Aborted');

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

            if (controller.signal.aborted) throw new Error('Aborted');
            updateUpload(uploadId, { progress: 80, status: 'database' });

            // 2.5 Ensure metadata records exist (same as upload logic)
            const insertMetadata = async (type: "speaker" | "language" | "audio_type" | "category", name: string, parentSpeakerId?: string) => {
                if (!name) return null;
                const tableName = type === 'audio_type' ? 'audio_types' : (type === 'speaker' ? 'speakers' : (type === 'language' ? 'languages' : (type === 'category' ? 'categories' : null)));
                if (!tableName) return null;

                try {
                    let payload: any = { name };
                    let conflictTarget = 'name';

                    if (type === 'audio_type' && parentSpeakerId) {
                        payload.speaker_id = parentSpeakerId;
                        const { data: existing } = await supabase.from('audio_types').select('id').eq('name', name).eq('speaker_id', parentSpeakerId).maybeSingle();
                        if (existing) return existing.id;

                        const { data: inserted, error } = await supabase.from('audio_types').insert([payload]).select('id').single();
                        if (error) console.warn(`Metadata (audio_types) insert error:`, error);
                        return inserted?.id || null;
                    }

                    const { data, error } = await supabase.from(tableName as any).upsert(payload, { onConflict: conflictTarget }).select('id').maybeSingle();
                    if (error && error.code !== '23505') console.warn(`Metadata (${tableName}) upsert error:`, error);
                    return data?.id || null;
                } catch (err) {
                    console.debug('Metadata record already exists or failed:', err);
                    return null;
                }
            };

            if (contentType === 'audio') {
                const currentSpeakerId = await insertMetadata('speaker', updatePayload.speaker);
                if (currentSpeakerId) {
                    await insertMetadata('audio_type', updatePayload.audio_type, currentSpeakerId);
                }
                const catsRaw = updatePayload.categories || [];
                const cats = Array.isArray(catsRaw) ? catsRaw : (typeof catsRaw === 'string' ? catsRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
                for (const c of cats) await insertMetadata('category', c);
            }
            await insertMetadata('language', updatePayload.language);

            // Remove internal fields before saving to database
            const { _storageProvider, ...dbPayload } = updatePayload;

            const { error: dbError } = await supabase
                .from('content')
                .update({ ...dbPayload, file_url: fileUrlPath, cover_image_url: coverUrlPath })
                .eq('id', contentId);

            if (dbError) throw dbError;

            updateUpload(uploadId, { progress: 100, status: 'completed' });
            toast.success("مواد کامیابی سے تبدیل ہو گیا!");

        } catch (err: any) {
            if (err.name === 'AbortError' || err.message === 'Aborted') return;
            console.error('Background edit error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
        } finally {
            delete abortControllers.current[uploadId];
        }
    }, [user, updateUpload]);


    const deleteContent = useCallback(async (id: string, title: string, fileUrl: string | null, coverImageUrl: string | null) => {
        const uploadId = crypto.randomUUID();
        const startTime = Date.now();

        const newDelete: ActiveUpload = {
            id: uploadId,
            fileName: title,
            title: title,
            progress: 0,
            status: 'deleting',
            startTime,
            type: 'delete'
        };

        setActiveUploads(prev => [newDelete, ...prev]);

        try {
            // Sequential deletion
            if (fileUrl) {
                updateUpload(uploadId, { progress: 20 });
                if (fileUrl.startsWith('ia://')) {
                    await deleteFromInternetArchive(fileUrl);
                } else if (fileUrl.startsWith('google-drive://')) {
                    await deleteFromGoogleDrive(fileUrl);
                } else {
                    await supabase.storage.from('content-files').remove([fileUrl]);
                }
            }

            updateUpload(uploadId, { progress: 40 });
            if (coverImageUrl) {
                await supabase.storage.from('content-files').remove([coverImageUrl]);
            }

            updateUpload(uploadId, { progress: 60 });
            await Promise.all([
                supabase.from('content_analytics').delete().eq('content_id', id),
                supabase.from('favorites').delete().eq('content_id', id),
                supabase.from('playlist_items').delete().eq('content_id', id)
            ]);

            updateUpload(uploadId, { progress: 80 });
            const { error: dbError } = await supabase.from('content').delete().eq('id', id);
            if (dbError) throw dbError;

            updateUpload(uploadId, { progress: 100, status: 'completed' });
            toast.success(`مواد کامیابی سے حذف کر دیا گیا: ${title}`);

        } catch (err: any) {
            console.error('Delete error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
        }
    }, [updateUpload]);

    const clearCompleted = useCallback(() => {
        setActiveUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'error'));
    }, []);

    return (
        <UploadContext.Provider value={{ activeUploads, uploadContent, editContent, deleteContent, cancelUpload, clearCompleted }}>
            {children}
        </UploadContext.Provider>
    );
};
