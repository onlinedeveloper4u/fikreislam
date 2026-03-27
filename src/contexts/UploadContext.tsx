"use client";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UploadContext, ActiveUpload } from './UploadContextTypes';
import { uploadToInternetArchive, deleteFromInternetArchive } from '@/lib/internetArchive';

import { 
    createSpeaker, createLanguage, createCategory, createAudioType, 
    getSpeakers, getAudioTypes, getCategories, getLanguages 
} from '@/actions/metadata';
import { insertContent, updateContentById, deleteContentById } from '@/actions/content';

const STORAGE_KEY = 'fikreislam_active_uploads';

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();
    const abortControllers = useRef<Record<string, AbortController>>({});

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as ActiveUpload[];
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

            const ensureMetadata = async (type: string, name: string, parentSpeakerId?: string) => {
                if (!name) return null;
                try {
                    if (type === 'speaker') {
                        const { data } = await createSpeaker(name);
                        return data?.id || null;
                    }
                    if (type === 'language') return (await createLanguage(name)).data?.id;
                    if (type === 'category') return (await createCategory(name)).data?.id;
                    if (type === 'audio_type' && parentSpeakerId) {
                        return (await createAudioType(name, parentSpeakerId)).data?.id;
                    }
                } catch (e) {
                    console.log("Upsert ignored error", e);
                }
                return null;
            };

            let currentSpeakerId = null;
            if (formData.contentType === 'audio') {
                currentSpeakerId = await ensureMetadata('speaker', formData.speaker);
                if (currentSpeakerId) {
                    await ensureMetadata('audio_type', formData.audioType, currentSpeakerId);
                }
                const catsRaw = formData.categoriesValue || [];
                const cats = Array.isArray(catsRaw) ? catsRaw : (typeof catsRaw === 'string' ? catsRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
                for (const c of cats) await ensureMetadata('category', c);
            }
            await ensureMetadata('language', formData.language);

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
                    lecture_date_gregorian: formData.gDate ? new Date(formData.gDate) : null,
                    hijri_date_day: formData.hDay ? parseInt(formData.hDay) : null,
                    hijri_date_month: formData.hMonth ? formData.hMonth.toString() : null,
                    hijri_date_year: formData.hYear ? parseInt(formData.hYear) : null,
                });
            }

            const { error: dbError } = await insertContent(contentPayload);
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

            if (newMainFile || newCoverFile) {
                updateUpload(uploadId, { status: 'uploading', progress: 10 });
                const iaResult = await uploadToInternetArchive(
                    newMainFile || new File([], "empty"),
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
                    if (currentFileUrl?.startsWith('ia://')) await deleteFromInternetArchive(currentFileUrl);
                }
                if (newCoverFile) coverUrlPath = iaResult.coverIaUrl;
            }

            if (controller.signal.aborted) throw new Error('Aborted');
            updateUpload(uploadId, { progress: 80, status: 'database' });

            const ensureMetadata = async (type: string, name: string, parentSpeakerId?: string) => {
                if (!name) return null;
                try {
                    if (type === 'speaker') return (await createSpeaker(name)).data?.id;
                    if (type === 'language') return (await createLanguage(name)).data?.id;
                    if (type === 'category') return (await createCategory(name)).data?.id;
                    if (type === 'audio_type' && parentSpeakerId) {
                        return (await createAudioType(name, parentSpeakerId)).data?.id;
                    }
                } catch (e) { console.log(e); }
                return null;
            };

            if (contentType === 'audio') {
                const currentSpeakerId = await ensureMetadata('speaker', updatePayload.speaker);
                if (currentSpeakerId) await ensureMetadata('audio_type', updatePayload.audio_type, currentSpeakerId);
                const catsRaw = updatePayload.categories || [];
                const cats = Array.isArray(catsRaw) ? catsRaw : (typeof catsRaw === 'string' ? catsRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : []);
                for (const c of cats) await ensureMetadata('category', c);
            }
            await ensureMetadata('language', updatePayload.language);

            const { _storageProvider, ...dbPayload } = updatePayload;

            const { error: dbError } = await updateContentById(contentId, { ...dbPayload, file_url: fileUrlPath, cover_image_url: coverUrlPath });
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

    const deleteContentWrapper = useCallback(async (id: string, title: string, fileUrl: string | null, coverImageUrl: string | null) => {
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
            if (fileUrl && fileUrl.startsWith('ia://')) {
                updateUpload(uploadId, { progress: 30 });
                await deleteFromInternetArchive(fileUrl);
            }

            updateUpload(uploadId, { progress: 60 });
            await deleteContentById(id);

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
        <UploadContext.Provider value={{ activeUploads, uploadContent, editContent, deleteContent: deleteContentWrapper, cancelUpload, clearCompleted }}>
            {children}
        </UploadContext.Provider>
    );
};
