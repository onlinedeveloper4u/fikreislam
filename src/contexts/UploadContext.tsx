"use client";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UploadContext, ActiveUpload } from './UploadContextTypes';
import { uploadToInternetArchive, deleteFromInternetArchive } from '@/lib/internetArchive';

const STORAGE_KEY = 'fikreislam_active_uploads';

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();
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
            updateUpload(uploadId, { status: 'uploading', progress: 10 });

            // 1. Upload to Internet Archive (Main File + optional Cover)
            const iaResult = await uploadToInternetArchive(
                mainFile,
                {
                    speaker: formData.speaker,
                    audioType: formData.audioType,
                    title: formData.title,
                    contentType: formData.contentType,
                },
                coverFile,
                controller.signal
            );

            if (controller.signal.aborted) throw new Error('Aborted');
            updateUpload(uploadId, { progress: 80, status: 'database' });

            // 2. Ensure metadata records exist
            const insertMetadata = async (type: "speaker" | "language" | "audio_type" | "category", name: string, parentSpeakerId?: string) => {
                if (!name) return null;
                const tableName = type === 'audio_type' ? 'audio_types' : (type === 'speaker' ? 'speakers' : (type === 'language' ? 'languages' : (type === 'category' ? 'categories' : null)));
                if (!tableName) return null;

                try {
                    let payload: any = { name };
                    let conflictTarget = 'name';

                    if (type === 'audio_type' && parentSpeakerId) {
                        payload.speaker_id = parentSpeakerId;
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

                        if (error) console.warn(`Metadata error:`, error);
                        return inserted?.id || null;
                    }

                    const { data, error } = await supabase
                        .from(tableName as any)
                        .upsert(payload, { onConflict: conflictTarget })
                        .select('id')
                        .maybeSingle();

                    if (error && error.code !== '23505') console.warn(`Metadata upsert error:`, error);
                    return data?.id || null;
                } catch (err) {
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
                file_url: iaResult.iaUrl,
                file_size: mainFile.size,
                cover_image_url: iaResult.coverIaUrl || null,
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
            if (err.name === 'AbortError' || err.message === 'Aborted') return;
            console.error('Background upload error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
            toast.error(`شامل کرنے میں ناکامی: ${formData.title}`);
        } finally {
            delete abortControllers.current[uploadId];
        }
    }, [user, updateUpload]);

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

            // If new file or cover is provided, we might need to upload to IA
            if (newMainFile || newCoverFile) {
                updateUpload(uploadId, { status: 'uploading', progress: 10 });
                
                // If we have a new main file, we use the standard upload process
                // If we only have a new cover, we need a special logic but IA works per-item.
                // However, the easiest way is to re-upload to a NEW IA item because I can't easily get the identifier 
                // of the old item without parsing the URL.
                
                const iaResult = await uploadToInternetArchive(
                    newMainFile || new File([], "empty"), // This needs refinement if only cover changes
                    {
                        speaker: updatePayload.speaker,
                        audioType: updatePayload.audio_type,
                        title: updatePayload.title,
                        contentType: contentType as any,
                    },
                    newCoverFile,
                    controller.signal
                );

                if (newMainFile) {
                    fileUrlPath = iaResult.iaUrl;
                    updatePayload.file_size = newMainFile.size;
                    // Delete old IA file if applicable
                    if (currentFileUrl?.startsWith('ia://')) await deleteFromInternetArchive(currentFileUrl);
                }
                
                if (newCoverFile) {
                    coverUrlPath = iaResult.coverIaUrl;
                    // Delete old IA cover is harder because we don't store it separately, 
                    // but IA delete works on the whole item if we cascade.
                }
            }

            if (controller.signal.aborted) throw new Error('Aborted');
            updateUpload(uploadId, { progress: 80, status: 'database' });

            // Metadata records
            const insertMetadata = async (type: "speaker" | "language" | "audio_type" | "category", name: string, parentSpeakerId?: string) => {
                if (!name) return null;
                const tableName = type === 'audio_type' ? 'audio_types' : (type === 'speaker' ? 'speakers' : (type === 'language' ? 'languages' : (type === 'category' ? 'categories' : null)));
                if (!tableName) return null;
                try {
                    let payload: any = { name };
                    if (type === 'audio_type' && parentSpeakerId) {
                        payload.speaker_id = parentSpeakerId;
                        const { data: existing } = await supabase.from('audio_types').select('id').eq('name', name).eq('speaker_id', parentSpeakerId).maybeSingle();
                        if (existing) return existing.id;
                        const { data: inserted, error } = await supabase.from('audio_types').insert([payload]).select('id').single();
                        return inserted?.id || null;
                    }
                    const { data, error } = await supabase.from(tableName as any).upsert(payload, { onConflict: 'name' }).select('id').maybeSingle();
                    return data?.id || null;
                } catch (err) { return null; }
            };

            if (contentType === 'audio') {
                const currentSpeakerId = await insertMetadata('speaker', updatePayload.speaker);
                if (currentSpeakerId) await insertMetadata('audio_type', updatePayload.audio_type, currentSpeakerId);
                const catsRaw = updatePayload.categories || [];
                const cats = Array.isArray(catsRaw) ? catsRaw : (typeof catsRaw === 'string' ? catsRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
                for (const c of cats) await insertMetadata('category', c);
            }
            await insertMetadata('language', updatePayload.language);

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
            // Sequential deletion from Internet Archive
            if (fileUrl && fileUrl.startsWith('ia://')) {
                updateUpload(uploadId, { progress: 30 });
                await deleteFromInternetArchive(fileUrl);
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
