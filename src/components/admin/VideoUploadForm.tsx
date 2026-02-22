import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/lib/utils';
import { Upload, Video as VideoIcon, Loader2 } from 'lucide-react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { TaxonomyCombobox } from './TaxonomyCombobox';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface VideoUploadFormProps {
    onSuccess?: () => void;
}

export function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
    const { user } = useAuth();
    const { uploadContent } = useUpload();
    const { t } = useTranslation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [language, setLanguage] = useState('اردو');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    const [taxonomies, setTaxonomies] = useState<{ language: string[]; }>({ language: [] });

    useMemo(() => {
        supabase.from('taxonomies').select('*').eq('type', 'language').then(({ data }) => {
            if (data) setTaxonomies({ language: data.map(t => t.name) });
        });
    }, []);

    const videoSchema = useMemo(() => z.object({
        title: z.string().trim().min(1, t('dashboard.upload.validation.titleRequired')),
        language: z.string().min(1, t('dashboard.upload.validation.langRequired')),
    }), [t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error(t('dashboard.upload.errorLogin')); return; }
        if (!file) { toast.error(t('dashboard.upload.errorNoFile')); return; }

        const validation = videoSchema.safeParse({ title, language });
        if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

        if (file.size > MAX_FILE_SIZE) { toast.error(t('dashboard.upload.errorFileTooLarge')); return; }
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) { toast.error(t('dashboard.upload.errorInvalidType', { type: 'video', allowed: '.mp4, .webm, .mov' })); return; }

        setIsSubmitting(true);
        try {
            const uploadData = {
                title,
                description,
                author,
                language,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                contentType: 'video' as const,
                useGoogleDrive: false,
            };

            uploadContent(uploadData, file, coverImage);
            toast.info(t('dashboard.upload.started'));
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="video-file">{t('dashboard.upload.fileLabel')} <span className="text-destructive">*</span></Label>
                    <div className="border-2 border-dashed border-border rounded-lg px-4 text-center hover:border-primary/50 h-[110px] flex items-center justify-center">
                        <input id="video-file" type="file" accept=".mp4,.webm,.mov" onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setFile(f);
                            if (f) setTitle(f.name.split('.').slice(0, -1).join('.'));
                        }} className="hidden" />
                        <label htmlFor="video-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                            <VideoIcon className="h-5 w-5" />
                            {file ? (
                                <>
                                    <span>
                                        {file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name}
                                        {file && <span className="ml-1 text-[10px] text-muted-foreground">({file.name.split('.').pop()?.toUpperCase()})</span>}
                                    </span>
                                    {file && <span className="text-[10px] text-primary/70">
                                        {formatBytes(file.size, {
                                            bytes: t('common.units.bytes'),
                                            kb: t('common.units.kb'),
                                            mb: t('common.units.mb'),
                                            gb: t('common.units.gb')
                                        })}
                                    </span>}
                                </>
                            ) : t('dashboard.upload.clickToUpload', { type: t('nav.video') })}
                        </label>
                    </div>
                </div>
                <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                    <Label className="text-[10px]">{t('dashboard.upload.coverLabel')}</Label>
                    <div className="border-2 border-dashed border-border rounded-full h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                        <input id="video-cover" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="hidden" />
                        <label htmlFor="video-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                            {coverImage ? <img src={URL.createObjectURL(coverImage)} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />}
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-title">{t('dashboard.upload.titleLabel')} <span className="text-destructive">*</span></Label>
                <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-author">{t('dashboard.upload.authorLabel')}</Label>
                <Input id="video-author" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-description">{t('dashboard.upload.descLabel')}</Label>
                <Textarea id="video-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all resize-none" />
            </div>

            <div className="space-y-2">
                <Label>{t('dashboard.upload.langLabel')} <span className="text-destructive">*</span></Label>
                <TaxonomyCombobox options={taxonomies.language} value={language} onChange={setLanguage} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-tags">{t('dashboard.upload.tagsLabel')}</Label>
                <Input id="video-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated, tags" className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {t('dashboard.upload.submitAdmin')}
            </Button>
        </form>
    );
}
