import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { formatBytes } from '@/lib/utils';
import { Upload, Loader2, Headphones, Video } from 'lucide-react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { MetadataCombobox } from '../shared/MetadataCombobox';
import { getSpeakers, getLanguages, getCategories, getMediaTypes } from '@/actions/metadata';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface MediaUploadFormProps {
    onSuccess?: () => void;
    initialType?: 'آڈیو' | 'ویڈیو';
}

export function MediaUploadForm({ onSuccess, initialType = 'آڈیو' }: MediaUploadFormProps) {
    const { user } = useAuth();
    const { uploadMedia } = useUpload();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contentType, setContentType] = useState<'آڈیو' | 'ویڈیو'>(initialType);
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    const [metadata, setMetadata] = useState<{
        speaker: string[];
        language: string[];
        media_type: string[];
        category: string[];
    }>({ speaker: [], language: [], media_type: [], category: [] });

    const [speaker, setSpeaker] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [categories, setCategories] = useState('');

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

    const [durHours, setDurHours] = useState('');
    const [durMinutes, setDurMinutes] = useState('');
    const [durSeconds, setDurSeconds] = useState('');

    const [venueManual, setVenueManual] = useState(false);
    const [venueText, setVenueText] = useState('');
    const [venueDistrict, setVenueDistrict] = useState('');
    const [venueTehsil, setVenueTehsil] = useState('');
    const [venueCity, setVenueCity] = useState('');
    const [venueArea, setVenueArea] = useState('');

    const [gDay, setGDay] = useState('');
    const [gMonth, setGMonth] = useState('');
    const [gYear, setGYear] = useState('');
    const [hDay, setHDay] = useState('');
    const [hMonth, setHMonth] = useState('');
    const [hYear, setHYear] = useState('');

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

    const mediaSchema = useMemo(() => z.object({
        title: z.string().trim().min(1, "عنوان ضروری ہے"),
        language: z.string().min(1, "زبان ضروری ہے"),
    }), []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile) {
            setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
            
            if (contentType === 'آڈیو') {
                const audio = new Audio();
                const objectUrl = URL.createObjectURL(selectedFile);
                audio.src = objectUrl;
                audio.onloadedmetadata = () => {
                    const duration = Math.floor(audio.duration);
                    setDurHours(Math.floor(duration / 3600).toString() || '');
                    setDurMinutes(Math.floor((duration % 3600) / 60).toString());
                    setDurSeconds((duration % 60).toString());
                    URL.revokeObjectURL(objectUrl);
                };
            } else {
                const video = document.createElement('video');
                const objectUrl = URL.createObjectURL(selectedFile);
                video.src = objectUrl;
                video.onloadedmetadata = () => {
                    const duration = Math.floor(video.duration);
                    setDurHours(Math.floor(duration / 3600).toString() || '');
                    setDurMinutes(Math.floor((duration % 3600) / 60).toString());
                    setDurSeconds((duration % 60).toString());
                    URL.revokeObjectURL(objectUrl);
                };
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error("میڈیا شامل کرنے کے لیے آپ کا داخل ہونا ضروری ہے"); return; }
        if (!file) { toast.error("براہ کرم شامل کرنے کے لیے فائل منتخب کریں"); return; }

        const validation = mediaSchema.safeParse({ title, language });
        if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

        if (file.size > MAX_FILE_SIZE) { toast.error("فائل بہت بڑی ہے (زیادہ سے زیادہ 500 ایم بی)"); return; }
        
        const allowedTypes = contentType === 'آڈیو' ? ALLOWED_AUDIO_TYPES : ALLOWED_VIDEO_TYPES;
        if (!allowedTypes.includes(file.type)) { 
            toast.error(`${contentType} کے لیے غلط فائل کی قسم`); 
            return; 
        }

        if (coverImage) {
            if (coverImage.size > MAX_IMAGE_SIZE) { toast.error("تصویر بہت بڑی ہے (زیادہ سے زیادہ 10 ایم بی)"); return; }
            if (!ALLOWED_IMAGE_TYPES.includes(coverImage.type)) { toast.error("غلط تصویر کی قسم"); return; }
        }

        const hasDuration = [durHours, durMinutes, durSeconds].some(p => p !== '' && p !== '0' && p !== '00');
        if (!hasDuration) { toast.error("دورانیہ ضروری ہے"); return; }
        if (!speaker) { toast.error("مقرر / بیان کنندہ ضروری ہے"); return; }
        if (!mediaType) { toast.error("میڈیا کی قسم ضروری ہے"); return; }

        setIsSubmitting(true);
        try {
            const uploadData = {
                title,
                language,
                contentType: contentType,
                duration: [durHours.padStart(2, '0') || '00', durMinutes.padStart(2, '0') || '00', durSeconds.padStart(2, '0') || '00'].join(':'),
                venue: venueManual ? venueText : [venueDistrict, venueTehsil, venueCity, venueArea].filter(Boolean).join(', '),
                speaker,
                mediaType,
                categoriesValue: categories,
                gDate: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
                hDay: hDay ? parseInt(hDay) : null,
                hMonth: hMonth ? parseInt(hMonth) : null,
                hYear: hYear ? parseInt(hYear) : null,
            };

            uploadMedia(uploadData, file, coverImage);
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
            <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/10 gap-4">
                <Label className="text-lg font-bold">{"میڈیا کی قسم منتخب کریں"}</Label>
                <RadioGroup 
                    value={contentType} 
                    onValueChange={(val: any) => {
                        setContentType(val);
                        setFile(null); // Clear file when type changes
                    }}
                    className="flex gap-8"
                >
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="آڈیو" id="type-audio" />
                        <Label htmlFor="type-audio" className="cursor-pointer flex items-center gap-2">
                            <Headphones className="h-4 w-4" /> {"آڈیو"}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="ویڈیو" id="type-video" />
                        <Label htmlFor="type-video" className="cursor-pointer flex items-center gap-2">
                            <Video className="h-4 w-4" /> {"ویڈیو"}
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="media-file">{"میڈیا کی فائل"} <span className="text-destructive">*</span></Label>
                    <div className="border-2 border-dashed border-border rounded-lg px-4 text-center hover:border-primary/50 transition-colors h-[110px] flex items-center justify-center">
                        <input 
                            id="media-file" 
                            type="file" 
                            accept={contentType === 'آڈیو' ? ".mp3,.wav,.ogg,.m4a" : ".mp4,.webm,.mov"} 
                            onChange={handleFileChange} 
                            className="hidden" 
                        />
                        <label htmlFor="media-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                            {contentType === 'آڈیو' ? <Headphones className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                            <span className="max-w-[80%] truncate text-center font-medium">
                                {file ? (file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name) : `${contentType} شامل کرنے کے لیے یہاں دبائیں`}
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
                        </label>
                    </div>
                </div>
                <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                    <Label className="text-[10px]">{"سرورق کی تصویر"}</Label>
                    <div className="border-2 border-dashed border-border rounded-full hover:border-primary/50 h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                        <input id="media-cover" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="hidden" />
                        <label htmlFor="media-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                            {coverImage ? <img src={URL.createObjectURL(coverImage)} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />}
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="media-title">{"عنوان"} <span className="text-destructive">*</span></Label>
                    <Input id="media-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={"عنوان درج کریں"} required className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all px-4" />
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
                        <Checkbox id="v-manual" checked={venueManual} onCheckedChange={(v) => setVenueManual(!!v)} />
                        <Label htmlFor="v-manual" className="text-xs cursor-pointer">{"جگہ دستی طور پر درج کریں"}</Label>
                    </div>
                </div>
                {venueManual ? <Input value={venueText} onChange={(e) => setVenueText(e.target.value)} placeholder={"مثلاً اسلام آباد، پاکستان"} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" /> :
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Input placeholder={"ضلع"} value={venueDistrict} onChange={(e) => setVenueDistrict(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 flex-1" />
                        <Input placeholder={"تحصیل"} value={venueTehsil} onChange={(e) => setVenueTehsil(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 flex-1" />
                        <Input placeholder={"شہر"} value={venueCity} onChange={(e) => setVenueCity(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 flex-1" />
                        <Input placeholder={"علاقہ"} value={venueArea} onChange={(e) => setVenueArea(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12 flex-1" />
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {"شامل کریں اور شائع کریں"}
            </Button>
        </form>
    );
}
