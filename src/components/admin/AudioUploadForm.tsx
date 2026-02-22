import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/lib/utils';
import {
    Upload, Music, Loader2, Headphones
} from 'lucide-react';

import { useUpload } from '@/contexts/UploadContextTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { MetadataCombobox } from './MetadataCombobox';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface AudioUploadFormProps {
    onSuccess?: () => void;
}

export function AudioUploadForm({ onSuccess }: AudioUploadFormProps) {
    const { user } = useAuth();
    const { uploadContent } = useUpload();
    const { t } = useTranslation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('اردو');
    const [file, setFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    const [metadata, setMetadata] = useState<{
        speaker: string[];
        language: string[];
        audio_type: string[];
        category: string[];
    }>({ speaker: [], language: [], audio_type: [], category: [] });

    useEffect(() => {
        const fetchData = async () => {
            const [speakers, languages, audioTypes, categories] = await Promise.all([
                supabase.from('speakers').select('name').order('name'),
                supabase.from('languages').select('name').order('name'),
                supabase.from('audio_types').select('name').order('name'),
                supabase.from('categories').select('name').order('name'),
            ]);

            setMetadata({
                speaker: speakers.data?.map(s => s.name) || [],
                language: languages.data?.map(l => l.name) || [],
                audio_type: audioTypes.data?.map(a => a.name) || [],
                category: categories.data?.map(c => c.name) || [],
            });
        };
        fetchData();
    }, []);

    // Set a default speaker if list not empty to help user
    useEffect(() => {
        if (metadata.speaker.length > 0 && !speaker) {
            // Option to set default or leave empty
        }
    }, [metadata.speaker]);

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
                <SelectTrigger className="flex-1 h-14 [&>span]:line-clamp-none [&>span]:overflow-visible pt-1">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item} value={item}>
                            {type === 'month' && monthType ? t(`common.months.${monthType}.${item}`) : item}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    const audioSchema = useMemo(() => z.object({
        title: z.string().trim().min(1, t('dashboard.upload.validation.titleRequired')),
        language: z.string().min(1, t('dashboard.upload.validation.langRequired')),
    }), [t]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile) {
            setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
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
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error(t('dashboard.upload.errorLogin')); return; }
        if (!file) { toast.error(t('dashboard.upload.errorNoFile')); return; }

        const validation = audioSchema.safeParse({ title, language });
        if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

        if (file.size > MAX_FILE_SIZE) { toast.error(t('dashboard.upload.errorFileTooLarge')); return; }
        if (!ALLOWED_AUDIO_TYPES.includes(file.type)) { toast.error(t('dashboard.upload.errorInvalidType', { type: 'audio', allowed: '.mp3, .wav, .ogg, .m4a' })); return; }

        if (coverImage) {
            if (coverImage.size > MAX_IMAGE_SIZE) { toast.error(t('dashboard.upload.errorImageTooLarge')); return; }
            if (!ALLOWED_IMAGE_TYPES.includes(coverImage.type)) { toast.error(t('dashboard.upload.errorInvalidImage')); return; }
        }

        const hasDuration = [durHours, durMinutes, durSeconds].some(p => p !== '' && p !== '0' && p !== '00');
        if (!hasDuration) { toast.error(t('dashboard.upload.validation.durationRequired')); return; }
        if (!speaker) { toast.error(t('dashboard.upload.validation.speakerRequired')); return; }
        if (!audioType) { toast.error(t('dashboard.upload.validation.audioTypeRequired')); return; }

        setIsSubmitting(true);
        try {
            const uploadData = {
                title,
                language,
                contentType: 'audio' as const,
                useGoogleDrive: true,
                duration: [durHours.padStart(2, '0') || '00', durMinutes.padStart(2, '0') || '00', durSeconds.padStart(2, '0') || '00'].join(':'),
                venue: venueManual ? venueText : [venueDistrict, venueTehsil, venueCity, venueArea].filter(Boolean).join(', '),
                speaker,
                audioType,
                categoriesValue: categories,
                gDate: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
                hDay: hDay ? parseInt(hDay) : null,
                hMonth: hMonth ? parseInt(hMonth) : null,
                hYear: hYear ? parseInt(hYear) : null,
                description: '', // Audio doesn't typically have description in this UI
                author: '',
                tags: [],
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
                    <Label htmlFor="audio-file">{t('dashboard.upload.fileLabel')} <span className="text-destructive">*</span></Label>
                    <div className="border-2 border-dashed border-border rounded-lg px-4 text-center hover:border-primary/50 transition-colors h-[110px] flex items-center justify-center">
                        <input id="audio-file" type="file" accept=".mp3,.wav,.ogg,.m4a" onChange={handleFileChange} className="hidden" />
                        <label htmlFor="audio-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                            <Headphones className="h-5 w-5" />
                            <span className="max-w-[80%] truncate text-center font-medium">
                                {file ? (file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name) : t('dashboard.upload.clickToUpload', { type: t('nav.audio') })}
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
                        </label>
                    </div>
                </div>
                <div className="space-y-2 md:col-span-1 flex flex-col items-center">
                    <Label className="text-[10px]">{t('dashboard.upload.coverLabel')}</Label>
                    <div className="border-2 border-dashed border-border rounded-full hover:border-primary/50 h-[110px] w-[110px] flex items-center justify-center overflow-hidden relative">
                        <input id="audio-cover" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="hidden" />
                        <label htmlFor="audio-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                            {coverImage ? <img src={URL.createObjectURL(coverImage)} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />}
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="audio-title">{t('dashboard.upload.titleLabel')} <span className="text-destructive">*</span></Label>
                <Input id="audio-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
                <Label>{t('dashboard.upload.langLabel')} <span className="text-destructive">*</span></Label>
                <MetadataCombobox options={metadata.language} value={language} onChange={setLanguage} />
            </div>

            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.durationLabel')} <span className="text-destructive">*</span></Label>
                        <div className="flex gap-2" dir="ltr">
                            <Input type="number" placeholder={t('dashboard.upload.hour')} value={durHours} onChange={(e) => setDurHours(e.target.value)} className="text-center bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                            <Input type="number" placeholder={t('dashboard.upload.minute')} value={durMinutes} onChange={(e) => setDurMinutes(e.target.value)} className="text-center bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                            <Input type="number" placeholder={t('dashboard.upload.second')} value={durSeconds} onChange={(e) => setDurSeconds(e.target.value)} className="text-center bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <Label>{t('dashboard.upload.venueLabel')}</Label>
                            <div className="flex items-center gap-2">
                                <Checkbox id="v-manual" checked={venueManual} onCheckedChange={(v) => setVenueManual(!!v)} />
                                <Label htmlFor="v-manual" className="text-xs cursor-pointer">{t('dashboard.upload.venueManualLabel')}</Label>
                            </div>
                        </div>
                        {venueManual ? <Input value={venueText} onChange={(e) => setVenueText(e.target.value)} placeholder={t('dashboard.upload.venuePlaceholder')} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" /> :
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder={t('dashboard.allContent.venueDistrictPlaceholder', { defaultValue: 'ضلع' })} value={venueDistrict} onChange={(e) => setVenueDistrict(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                                <Input placeholder={t('dashboard.allContent.venueTehsilPlaceholder', { defaultValue: 'تحصیل' })} value={venueTehsil} onChange={(e) => setVenueTehsil(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                                <Input placeholder={t('dashboard.allContent.venueCityPlaceholder', { defaultValue: 'شہر' })} value={venueCity} onChange={(e) => setVenueCity(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                                <Input placeholder={t('dashboard.allContent.venueAreaPlaceholder', { defaultValue: 'علاقہ' })} value={venueArea} onChange={(e) => setVenueArea(e.target.value)} className="bg-background/50 border-border/40 hover:bg-background/80 transition-all h-12" />
                            </div>
                        }
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.speakerLabel')} <span className="text-destructive">*</span></Label>
                        <MetadataCombobox options={metadata.speaker} value={speaker} onChange={setSpeaker} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.audioTypeLabel')} <span className="text-destructive">*</span></Label>
                        <MetadataCombobox options={metadata.audio_type} value={audioType} onChange={setAudioType} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t('dashboard.upload.categoriesLabel')}</Label>
                    <MetadataCombobox options={metadata.category} value={categories} onChange={setCategories} />
                </div>
            </div>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label>{t('dashboard.upload.dateGregorianLabel')}</Label>
                    <div className="flex gap-2">
                        <DatePartSelect type="day" value={gDay} onChange={setGDay} placeholder={t('dashboard.upload.day')} />
                        <DatePartSelect type="month" value={gMonth} onChange={setGMonth} placeholder={t('dashboard.upload.month')} monthType="gregorian" />
                        <DatePartSelect type="year" value={gYear} onChange={setGYear} placeholder={t('dashboard.upload.year')} monthType="gregorian" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>{t('dashboard.upload.dateHijriLabel')}</Label>
                    <div className="flex gap-2">
                        <DatePartSelect type="day" value={hDay} onChange={setHDay} placeholder={t('dashboard.upload.day')} />
                        <DatePartSelect type="month" value={hMonth} onChange={setHMonth} placeholder={t('dashboard.upload.month')} monthType="hijri" />
                        <DatePartSelect type="year" value={hYear} onChange={setHYear} placeholder={t('dashboard.upload.year')} monthType="hijri" />
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {t('dashboard.upload.submitAdmin')}
            </Button>
        </form>
    );
}
