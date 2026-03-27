import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { formatBytes } from '@/lib/utils';
import { Upload, Video as VideoIcon, Loader2 } from 'lucide-react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { MetadataCombobox } from './MetadataCombobox';
import { getLanguages } from '@/actions/metadata';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface VideoUploadFormProps {
    onSuccess?: () => void;
}

export function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
    const { user } = useAuth();
    const { uploadContent } = useUpload();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [language, setLanguage] = useState('اردو');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    const [metadata, setMetadata] = useState<{ language: string[]; }>({ language: [] });

    useEffect(() => {
        getLanguages().then(({ data }) => {
            if (data) setMetadata({ language: data.map(l => l.name) });
        });
    }, []);

    const videoSchema = useMemo(() => z.object({
        title: z.string().trim().min(1, "عنوان ضروری ہے"),
        language: z.string().min(1, "زبان ضروری ہے"),
    }), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error("مواد شامل کرنے کے لیے آپ کا داخل ہونا ضروری ہے"); return; }
        if (!file) { toast.error("براہ کرم شامل کرنے کے لیے فائل منتخب کریں"); return; }

        const validation = videoSchema.safeParse({ title, language });
        if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

        if (file.size > MAX_FILE_SIZE) { toast.error("فائل بہت بڑی ہے (زیادہ سے زیادہ 500 ایم بی)"); return; }
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) { toast.error("ویڈیو کے لیے غلط فائل کی قسم۔ قبول شدہ: .mp4, .webm, .mov"); return; }

        setIsSubmitting(true);
        try {
            const uploadData = {
                title,
                description,
                author,
                language,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                contentType: 'video' as const,
            };

            uploadContent(uploadData, file, coverImage);
            toast.info("پس منظر میں شامل ہونا شروع ہو گیا ہے");
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="video-file">{"مواد کی فائل"} <span className="text-destructive">*</span></Label>
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
                                            bytes: "بائٹس",
                                            kb: "کے بی",
                                            mb: "ایم بی",
                                            gb: "جی بی"
                                        })}
                                    </span>}
                                </>
                            ) : `${"ویڈیو"} شامل کرنے کے لیے یہاں دبائیں`}
                        </label>
                    </div>
                </div>
                <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                    <Label className="text-[10px]">{"سرورق کی تصویر"}</Label>
                    <div className="border-2 border-dashed border-border rounded-full h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                        <input id="video-cover" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="hidden" />
                        <label htmlFor="video-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                            {coverImage ? <img src={URL.createObjectURL(coverImage)} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />}
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-title">{"عنوان"} <span className="text-destructive">*</span></Label>
                <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-author">{"مصنف"}</Label>
                <Input id="video-author" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-description">{"تفصیل"}</Label>
                <Textarea id="video-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all resize-none" />
            </div>

            <div className="space-y-2">
                <Label>{"زبان"} <span className="text-destructive">*</span></Label>
                <MetadataCombobox options={metadata.language} value={language} onChange={setLanguage} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-tags">{"نشانیاں"}</Label>
                <Input id="video-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated, tags" className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {"شامل کریں اور شائع کریں"}
            </Button>
        </form>
    );
}
