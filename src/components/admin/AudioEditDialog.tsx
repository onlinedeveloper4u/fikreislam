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
import { Upload, Headphones, Loader2, Save } from 'lucide-react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { MetadataCombobox } from './MetadataCombobox';
import { formatBytes } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getSpeakers, getLanguages, getCategories, getAudioTypes } from '@/actions/metadata';

interface AudioEditDialogProps {
    content: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AudioEditDialog({ content, open, onOpenChange, onSuccess }: AudioEditDialogProps) {
    const { editContent } = useUpload();

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
    const [audioType, setAudioType] = useState('');
    const [categories, setCategories] = useState('');

    const [metadata, setMetadata] = useState<{
        speaker: string[];
        language: string[];
        audio_type: string[];
        category: string[];
    }>({ speaker: [], language: [], audio_type: [], category: [] });

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: speakers }, { data: languages }, { data: categories }] = await Promise.all([
                getSpeakers(),
                getLanguages(),
                getCategories(),
            ]);

            setMetadata({
                speaker: speakers?.map(s => s.name) || [],
                language: languages?.map(l => l.name) || [],
                audio_type: [], // Loaded dynamically based on speaker
                category: categories?.map(c => c.name) || [],
            });
        };
        fetchData();
    }, []);

    // Dynamically load audio types when speaker changes
    useEffect(() => {
        const fetchAudioTypesForSpeaker = async () => {
            if (!speaker) {
                setMetadata(prev => ({ ...prev, audio_type: [] }));
                return;
            }

            try {
                // 1. Get Speaker ID
                const { data: speakerData } = await getSpeakers();
                const matchedSpeaker = speakerData?.find(s => s.name === speaker);

                if (!matchedSpeaker) return;

                // 2. Get Audio Types for that Speaker
                const { data: typeData } = await getAudioTypes();

                setMetadata(prev => ({
                    ...prev,
                    audio_type: typeData?.map(t => t.name) || []
                }));
            } catch (err) {
                console.error("Failed to load audio types for speaker", err);
            }
        };

        fetchAudioTypesForSpeaker();
    }, [speaker]);

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
        if (content && content.type === 'audio') {
            setTitle(content.title);
            setLanguage(content.language || 'اردو');
            if (content.duration) {
                const parts = content.duration.split(':').map(Number);
                setDurHours(parts[0]?.toString() || '');
                setDurMinutes(parts[1]?.toString() || '');
                setDurSeconds(parts[2]?.toString() || '');
            }
            if (content.venue) {
                const parts = content.venue.split(',').map(p => p.trim());
                if (parts.length >= 4 && !['ضلع', 'تحصیل', 'شہر', 'علاقہ'].some(kw => content.venue.includes(kw))) {
                    setVenueDistrict(parts[0]); setVenueTehsil(parts[1]); setVenueCity(parts[2]); setVenueArea(parts[3] || ''); setVenueManual(false);
                } else {
                    setVenueText(content.venue); setVenueManual(true);
                }
            }
            setSpeaker(content.speaker || '');
            setAudioType(content.audio_type || '');
            setCategories(content.categories?.join(', ') || '');
            if (content.lecture_date_gregorian) {
                const [y, m, d] = content.lecture_date_gregorian.split('-');
                setGYear(y); setGMonth(parseInt(m).toString()); setGDay(parseInt(d).toString());
            }
            setHDay(content.hijri_date_day?.toString() || '');
            setHMonth(content.hijri_date_month || '');
            setHYear(content.hijri_date_year?.toString() || '');

            if (content.file_url) {
                if (!content.file_url.includes('ia://')) {
                    const parts = content.file_url.split('.');
                    if (parts.length > 1) {
                        const ext = parts[parts.length - 1].toUpperCase();
                        setFileType(ext);
                    }
                } else {
                    setFileType('MP3');
                }
            }
        }
    }, [content]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setNewFile(file);
        if (file) {
            const ext = file.name.split('.').pop()?.toUpperCase() || '';
            setFileType(ext);
        } else if (content?.file_url) {
            // Restore original file type if selection is cleared
            if (content.file_url.includes('ia://')) {
                setFileType('MP3');
            } else {
                const parts = content.file_url.split('.');
                if (parts.length > 1) {
                    setFileType(parts[parts.length - 1].toUpperCase());
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;
        setIsSubmitting(true);
        try {
            const updatePayload: any = {
                title,
                language,
                duration: [durHours.padStart(2, '0') || '00', durMinutes.padStart(2, '0') || '00', durSeconds.padStart(2, '0') || '00'].join(':'),
                venue: venueManual ? venueText : [venueDistrict, venueTehsil, venueCity, venueArea].filter(Boolean).join(', '),
                speaker,
                audio_type: audioType,
                categories: categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [],
                lecture_date_gregorian: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
                hijri_date_day: hDay ? parseInt(hDay) : null,
                hijri_date_month: hMonth || null,
                hijri_date_year: hYear ? parseInt(hYear) : null,
                status: content.status === 'rejected' ? 'pending' : content.status,
            };

            editContent(content.id, content.status, updatePayload, newFile, newCoverImage, content.title, content.file_url, 'audio');
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
                    <DialogTitle>{"مواد میں ترمیم کریں"} (آڈیو)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 md:col-span-3">
                            <Label>{"مواد کی فائل"} <span className="text-destructive">*</span></Label>
                            <div className="border-2 border-dashed border-border rounded-lg px-4 text-center h-[110px] flex items-center justify-center">
                                <input id="edit-audio-file" type="file" accept=".mp3,.wav,.ogg,.m4a" onChange={handleFileChange} className="hidden" />
                                <label htmlFor="edit-audio-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                                    <Headphones className="h-5 w-5" />
                                    <span className="max-w-[80%] truncate text-center font-medium">
                                        {newFile ? (newFile.name.includes('.') ? newFile.name.substring(0, newFile.name.lastIndexOf('.')) : newFile.name) :
                                            (content?.title || `${"آڈیو"} شامل کرنے کے لیے یہاں دبائیں`)}
                                        {fileType && <span className="ml-1 text-[10px] text-muted-foreground">({fileType})</span>}
                                    </span>
                                    {(newFile || content?.file_size) && (
                                        <span className="text-[10px] text-primary/70">
                                            {formatBytes(newFile ? newFile.size : content?.file_size, {
                                                bytes: "بائٹس",
                                                kb: "کے بی",
                                                mb: "ایم بی",
                                                gb: "جی بی"
                                            })}
                                            {!newFile && content?.file_size && ` • ${"پہلے سے موجود"}`}
                                        </span>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                            <Label className="text-[10px]">{"سرورق کی تصویر"}</Label>
                            <div className="border-2 border-dashed border-border rounded-full h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                                <input id="edit-audio-cover" type="file" accept="image/*" onChange={(e) => setNewCoverImage(e.target.files?.[0] || null)} className="hidden" />
                                <label htmlFor="edit-audio-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                                    {newCoverImage ? <img src={URL.createObjectURL(newCoverImage)} className="w-full h-full object-cover" /> :
                                        (content.cover_image_url ? <img src={resolveExternalUrl(content.cover_image_url)} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />)}
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
                            <Label>{"آڈیو کی قسم"} <span className="text-destructive">*</span></Label>
                            <MetadataCombobox options={metadata.audio_type} value={audioType} onChange={setAudioType} />
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
                                <Checkbox id="e-v-manual" checked={venueManual} onCheckedChange={(v) => setVenueManual(!!v)} />
                                <Label htmlFor="e-v-manual" className="text-xs cursor-pointer">{"جگہ دستی طور پر درج کریں"}</Label>
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
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> {"محفوظ کریں"}</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
}
