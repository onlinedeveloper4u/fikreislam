import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Video as VideoIcon, Upload, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpload } from '@/contexts/UploadContextTypes';
import { TaxonomyCombobox } from './TaxonomyCombobox';
import { formatBytes } from '@/lib/utils';

interface VideoEditDialogProps {
    content: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function VideoEditDialog({ content, open, onOpenChange, onSuccess }: VideoEditDialogProps) {
    const { t } = useTranslation();
    const { editContent } = useUpload();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [language, setLanguage] = useState('اردو');
    const [tags, setTags] = useState('');

    const [taxonomies, setTaxonomies] = useState<{ language: string[]; }>({ language: [] });

    useMemo(() => {
        supabase.from('taxonomies').select('*').eq('type', 'language').then(({ data }) => {
            if (data) setTaxonomies({ language: data.map(t => t.name) });
        });
    }, []);

    const [newFile, setNewFile] = useState<File | null>(null);
    const [newCoverImage, setNewCoverImage] = useState<File | null>(null);

    useEffect(() => {
        if (content && content.type === 'video') {
            setTitle(content.title);
            setDescription(content.description || '');
            setAuthor(content.author || '');
            setLanguage(content.language || 'اردو');
            setTags(content.tags?.join(', ') || '');
        }
    }, [content]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;
        setIsSubmitting(true);
        try {
            const updatePayload = {
                title,
                description,
                author,
                language,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                status: content.status === 'rejected' ? 'pending' : content.status,
            };

            await editContent(content.id, content.status, updatePayload, newFile, newCoverImage, content.title, content.file_url, 'video');
            onSuccess();
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('dashboard.myContent.edit.title')} (ویڈیو)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 md:col-span-3">
                            <Label>{t('dashboard.upload.fileLabel')} <span className="text-destructive">*</span></Label>
                            <div className="border-2 border-dashed border-border rounded-lg px-4 text-center h-[110px] flex items-center justify-center">
                                <input id="edit-video-file" type="file" accept=".mp4,.webm,.mov" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="hidden" />
                                <label htmlFor="edit-video-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                                    <VideoIcon className="h-5 w-5" />
                                    <span className="max-w-[80%] truncate text-center font-medium">
                                        {newFile ? newFile.name : (content?.title || t('dashboard.upload.clickToUpload', { type: t('nav.video') }))}
                                    </span>
                                    {(newFile || content?.file_size) && (
                                        <span className="text-[10px] text-primary/70">
                                            {formatBytes(newFile ? newFile.size : content?.file_size)}
                                            {!newFile && content?.file_size && ` • ${t('dashboard.upload.existing') ?? 'Existing'}`}
                                        </span>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                            <Label className="text-[10px]">{t('dashboard.upload.coverLabel')}</Label>
                            <div className="border-2 border-dashed border-border rounded-full h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                                <input id="edit-video-cover" type="file" accept="image/*" onChange={(e) => setNewCoverImage(e.target.files?.[0] || null)} className="hidden" />
                                <label htmlFor="edit-video-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                                    {newCoverImage ? <img src={URL.createObjectURL(newCoverImage)} className="w-full h-full object-cover" /> :
                                        (content?.cover_image_url ? <img src={content.cover_image_url} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />)}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.titleLabel')} <span className="text-destructive">*</span></Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.authorLabel')}</Label>
                        <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.descLabel')}</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all resize-none" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.langLabel')} <span className="text-destructive">*</span></Label>
                        <TaxonomyCombobox options={taxonomies.language} value={language} onChange={setLanguage} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.tagsLabel')}</Label>
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">{t('common.cancel')}</Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> {t('dashboard.myContent.edit.save')}</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
