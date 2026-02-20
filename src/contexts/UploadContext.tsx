import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UploadContext, ActiveUpload } from './UploadContextTypes';

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

                const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'upload',
                        fileName: fileName,
                        contentType: mainFile.type,
                        base64: base64Data,
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
                // Ignore constraint errors if it already exists
                await supabase.from('taxonomies').insert({ type, name });
            };

            if (formData.contentType === 'audio') {
                await insertTaxonomy('speaker', formData.speaker);
                await insertTaxonomy('audio_type', formData.audioType);
                const cats = formData.categoriesValue ? formData.categoriesValue.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
                for (const c of cats) await insertTaxonomy('category', c);
            }
            await insertTaxonomy('language', formData.language);

            // 3. Create database record
            const { error: dbError } = await supabase
                .from('content')
                .insert({
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
                    // Audio specialized metadata
                    duration: formData.duration || null,
                    venue: formData.venue || null,
                    speaker: formData.speaker || null,
                    audio_type: formData.audioType || null,
                    categories: formData.categoriesValue ? formData.categoriesValue.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
                    lecture_date_gregorian: formData.gDate || null,
                    hijri_date_day: formData.hDay || null,
                    hijri_date_month: formData.hMonth ? formData.hMonth.toString() : null,
                    hijri_date_year: formData.hYear || null,
                });

            if (dbError) throw dbError;

            updateUpload(uploadId, { progress: 100, status: 'completed' });
            toast.success(`Upload completed: ${formData.title}`);

        } catch (err: any) {
            console.error('Background upload error:', err);
            updateUpload(uploadId, { status: 'error', error: err.message || 'Unknown error' });
            toast.error(`Upload failed: ${formData.title}`);
        }
    }, [user, role, updateUpload]);

    const clearCompleted = useCallback(() => {
        setActiveUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'error'));
    }, []);

    return (
        <UploadContext.Provider value={{ activeUploads, uploadContent, clearCompleted }}>
            {children}
        </UploadContext.Provider>
    );
};
