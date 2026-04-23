import { useState, useEffect, useMemo } from 'react';

import { resolveExternalUrl } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Headphones, Video, Loader2, Save } from 'lucide-react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { MetadataCombobox } from '../shared/MetadataCombobox';
import { formatBytes } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getSpeakers, getLanguages, getCategories, getMediaTypes } from '@/actions/metadata';

interface MediaEditDialogProps {
    media: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function MediaEditDialog({ media, open, onOpenChange, onSuccess }: MediaEditDialogProps) {
    const { editMedia } = useUpload();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('اردو');

    const [durHours, setDurHours] = useState('');
    const [durMinutes, setDurMinutes] = useState('');
    const [durSeconds, setDurSeconds] = useState('');

    const [venueManual, setVenueManual] = useState(false);
    const [venueText, setVenueText] = useState('');
    const [venueDistrict, setVenueDistrict] = useState('');
    const [venueTehsil, setVenueTehsil] = useState('');
    const [venueCity, setVenueCity] = useState('');
    const [venueArea, setVenueArea] = useState('');

    const [speaker, setSpeaker] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [categories, setCategories] = useState('');

    const [metadata, setMetadata] = useState<{
        speaker: string[];
        language: string[];
        media_type: string[];
        category: string[];
    }>({ speaker: [], language: [], media_type: [], category: [] });

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: speakers }, { data: languages }, { data: categoriesData }, { data: mediaTypes }] = await Promise.all([
                getSpeakers(),
                getLanguages(),
                getCategories(),
                getMediaTypes(),
            ]);

            setMetadata({
                speaker: speakers?.map(s => s.name) || [],
                language: languages?.map(l => l.name) || [],
                media_type: mediaTypes?.map(t => t.name) || [],
                category: categoriesData?.map(c => c.name) || [],
            });
        };
        fetchData();
    }, []);

    const [newFile, setNewFile] = useState<File | null>(null);
    const [newCoverImage, setNewCoverImage] = useState<File | null>(null);

    const [gDay, setGDay] = useState('');
    const [gMonth, setGMonth] = useState('');
    const [gYear, setGYear] = useState('');
    const [hDay, setHDay] = useState('');
    const [hMonth, setHMonth] = useState('');
    const [hYear, setHYear] = useState('');
    const [fileType, setFileType] = useState<string>('');

    const DatePartSelect = ({
        type, value, onChange, placeholder, monthType
    }: {
        type: 'day' | 'month' | 'year',
        value: string,
        onChange: (val: string) => void,
        placeholder: string,
        monthType?: 'gregorian' | 'hijri'
    }) => {
        const items = useMemo(() => {
            if (type === 'day') return Array.from({ length: monthType === 'hijri' ? 30 : 31 }, (_, i) => (i + 1).toString());
            if (type === 'year') {
                const currentYear = new Date().getFullYear();
                const startYear = monthType === 'hijri' ? 1400 : 1900;
                const endYear = (monthType === 'hijri' ? 1450 : currentYear) + 5;
                return Array.from({ length: endYear - startYear + 1 }, (_, i) => (endYear - i).toString());
            }
            if (type === 'month') return Array.from({ length: 12 }, (_, i) => (i + 1).toString());
            return [];
        }, [type, monthType]);

        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="flex-1 h-12 [&>span]:line-clamp-none [&>span]:overflow-visible pt-1">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item} value={item}>
                            {type === 'month' && monthType ? (() => {
                                const months: Record<string, Record<string, string>> = {
                                    gregorian: { "1": "جنوری", "2": "فروری", "3": "مارچ", "4": "اپریل", "5": "مئی", "6": "جون", "7": "جولائی", "8": "اگست", "9": "ستمبر", "10": "اکتوبر", "11": "نومبر", "12": "دسمبر" },
                                    hijri: { "1": "محرم", "2": "صفر", "3": "ربیع الاول", "4": "ربیع الثانی", "5": "جمادی الاولیٰ", "6": "جمادی الاخریٰ", "7": "رجب", "8": "شعبان", "9": "رمضان", "10": "شوال", "11": "ذی القعدہ", "12": "ذی الحجہ" }
                                };
                                return months[monthType]?.[item] || item;
                            })() : item}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    useEffect(() => {
        if (media && (media.type === 'آڈیو' || media.type === 'ویڈیو')) {
            setTitle(media.title);
            setLanguage(media.language || 'اردو');
            if (media.duration) {
                const parts = media.duration.split(':').map(Number);
                setDurHours(parts[0]?.toString() || '');
                setDurMinutes(parts[1]?.toString() || '');
                setDurSeconds(parts[2]?.toString() || '');
            }
            if (media.venue) {
                const parts = media.venue.split(',').map(p => p.trim());
                if (parts.length >= 4 && !['ضلع', 'تحصیل', 'شہر', 'علاقہ'].some(kw => media.venue.includes(kw))) {
                    setVenueDistrict(parts[0]); setVenueTehsil(parts[1]); setVenueCity(parts[2]); setVenueArea(parts[3] || ''); setVenueManual(false);
                } else {
                    setVenueText(media.venue); setVenueManual(true);
                }
            }
            setSpeaker(media.speaker || '');
            setMediaType(media.media_type || '');
            setCategories(media.categories?.join(', ') || '');
            if (media.lecture_date_gregorian) {
                const [y, m, d] = media.lecture_date_gregorian.split('-');
                setGYear(y); setGMonth(parseInt(m).toString()); setGDay(parseInt(d).toString());
            }
            setHDay(media.hijri_date_day?.toString() || '');
            setHMonth(media.hijri_date_month || '');
            setHYear(media.hijri_date_year?.toString() || '');

            if (media.file_url) {
                const parts = media.file_url.split('.');
                if (parts.length > 1) {
                    const ext = parts[parts.length - 1].toUpperCase();
                    setFileType(ext);
                } else if (media.file_url.includes('ia://')) {
                    setFileType(media.type === 'آڈیو' ? 'MP3' : 'MP4');
                }
            }
        }
    }, [media]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setNewFile(file);
        if (file) {
            const ext = file.name.split('.').pop()?.toUpperCase() || '';
            setFileType(ext);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!media) return;
        setIsSubmitting(true);
        try {
            const updatePayload: any = {
                title,
                language,
                duration: [durHours.padStart(2, '0') || '00', durMinutes.padStart(2, '0') || '00', durSeconds.padStart(2, '0') || '00'].join(':'),
                venue: venueManual ? venueText : [venueDistrict, venueTehsil, venueCity, venueArea].filter(Boolean).join(', '),
                speaker,
                media_type: mediaType,
                categories: categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [],
                lecture_date_gregorian: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
                hijri_date_day: hDay ? parseInt(hDay) : null,
                hijri_date_month: hMonth || null,
                hijri_date_year: hYear ? parseInt(hYear) : null,
                status: media.status === 'شائع شدہ' ? 'شائع شدہ' : 'غیر شائع شدہ',
            };

            editMedia(media.id, media.status, updatePayload, newFile, newCoverImage, media.title, media.file_url, media.type);
            toast.info("پس منظر میں شامل ہونا شروع ہو گیا ہے");
            onSuccess();
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{"میڈیا میں ترمیم کریں"} ({media?.type})</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 md:col-span-3">
                            <Label>{"میڈیا کی فائل"} <span className="text-destructive">*</span></Label>
                            <div className="border-2 border-dashed border-border rounded-lg px-4 text-center h-[110px] flex items-center justify-center">
                                <input 
                                    id="edit-media-file" 
                                    type="file" 
                                    accept={media?.type === 'آڈیو' ? ".mp3,.wav,.ogg,.m4a" : ".mp4,.webm,.mov"} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />
                                <label htmlFor="edit-media-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                                    {media?.type === 'آڈیو' ? <Headphones className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                    <span className="max-w-[80%] truncate text-center font-medium">
                                        {newFile ? (newFile.name.includes('.') ? newFile.name.substring(0, newFile.name.lastIndexOf('.')) : newFile.name) :
                                            (media?.title || `${media?.type} شامل کرنے کے لیے یہاں دبائیں`)}
                                        {fileType && <span className="ml-1 text-[10px] text-muted-foreground">({fileType})</span>}
                                    </span>
                                    {(newFile || media?.file_size) && (
                                        <span className="text-[10px] text-primary/70">
                                            {formatBytes(newFile ? newFile.size : media?.file_size, {
                                                bytes: "بائٹس",
                                                kb: "کے بی",
                                                mb: "ایم بی",
                                                gb: "جی بی"
                                            })}
                                            {!newFile && media?.file_size && ` • ${"پہلے سے موجود"}`}
                                        </span>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                            <Label className="text-[10px]">{"سرورق کی تصویر"}</Label>
                            <div className="border-2 border-dashed border-border rounded-full h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                                <input id="edit-media-cover" type="file" accept="image/*" onChange={(e) => setNewCoverImage(e.target.files?.[0] || null)} className="hidden" />
                                <label htmlFor="edit-media-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                                    {newCoverImage ? <img src={URL.createObjectURL(newCoverImage)} className="w-full h-full object-cover" /> :
                                        (media?.cover_image_url ? <img src={resolveExternalUrl(media.cover_image_url)} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />)}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2 md:col-span-3">
                            <Label>{"عنوان"} <span className="text-destructive">*</span></Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={"عنوان درج کریں"} required className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all px-4" />
                        </div>
                        <div className="space-y-2">
                            <Label>{"دورانیہ"} <span className="text-destructive">*</span></Label>
                            <div className="flex gap-1" dir="ltr">
                                <Input type="number" placeholder={"گھنٹہ"} value={durHours} onChange={(e) => setDurHours(e.target.value)} className="text-center bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 px-1" />
                                <Input type="number" placeholder={"منٹ"} value={durMinutes} onChange={(e) => setDurMinutes(e.target.value)} className="text-center bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 px-1" />
                                <Input type="number" placeholder={"سیکنڈ"} value={durSeconds} onChange={(e) => setDurSeconds(e.target.value)} className="text-center bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 px-1" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{"مقرر / بیان کنندہ"} <span className="text-destructive">*</span></Label>
                            <MetadataCombobox options={metadata.speaker} value={speaker} onChange={setSpeaker} />
                        </div>
                        <div className="space-y-2">
                            <Label>{"میڈیا کی قسم"} <span className="text-destructive">*</span></Label>
                            <MetadataCombobox options={metadata.media_type} value={mediaType} onChange={setMediaType} />
                        </div>
                        <div className="space-y-2">
                            <Label>{"زبان"} <span className="text-destructive">*</span></Label>
                            <MetadataCombobox options={metadata.language} value={language} onChange={setLanguage} />
                        </div>
                        <div className="space-y-2">
                            <Label>{"زمرہ جات"}</Label>
                            <MetadataCombobox options={metadata.category} value={categories} onChange={setCategories} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <Label>{"مقام / جگہ"}</Label>
                            <div className="flex items-center gap-2">
                                <Checkbox id="e-m-manual" checked={venueManual} onCheckedChange={(v) => setVenueManual(!!v)} />
                                <Label htmlFor="e-m-manual" className="text-xs cursor-pointer">{"جگہ دستی طور پر درج کریں"}</Label>
                            </div>
                        </div>
                        {venueManual ? <Input value={venueText} onChange={(e) => setVenueText(e.target.value)} placeholder={"مثلاً اسلام آباد، پاکستان"} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" /> :
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <Input placeholder={"ضلع"} value={venueDistrict} onChange={(e) => setVenueDistrict(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                                <Input placeholder={"تحصیل"} value={venueTehsil} onChange={(e) => setVenueTehsil(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                                <Input placeholder={"شہر"} value={venueCity} onChange={(e) => setVenueCity(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                                <Input placeholder={"علاقہ"} value={venueArea} onChange={(e) => setVenueArea(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                            </div>
                        }
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{"عیسوی تاریخ"}</Label>
                            <div className="flex gap-2">
                                <DatePartSelect type="day" value={gDay} onChange={setGDay} placeholder={"دن"} />
                                <DatePartSelect type="month" value={gMonth} onChange={setGMonth} placeholder={"مہینہ"} monthType="gregorian" />
                                <DatePartSelect type="year" value={gYear} onChange={setGYear} placeholder={"سال"} monthType="gregorian" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{"ہجری تاریخ"}</Label>
                            <div className="flex gap-2">
                                <DatePartSelect type="day" value={hDay} onChange={setHDay} placeholder={"دن"} />
                                <DatePartSelect type="month" value={hMonth} onChange={setHMonth} placeholder={"مہینہ"} monthType="hijri" />
                                <DatePartSelect type="year" value={hYear} onChange={setHYear} placeholder={"سال"} monthType="hijri" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">{"منسوخ"}</Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="ml-2 h-4 w-4" /> {"محفوظ کریں"}</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
}
