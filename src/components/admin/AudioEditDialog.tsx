import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';
import { Upload, Headphones, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpload } from '@/contexts/UploadContextTypes';
import { TaxonomyCombobox } from './TaxonomyCombobox';
import { formatBytes } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface AudioEditDialogProps {
    content: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AudioEditDialog({ content, open, onOpenChange, onSuccess }: AudioEditDialogProps) {
    const { t } = useTranslation();
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

    const [taxonomies, setTaxonomies] = useState<{
        speaker: string[];
        language: string[];
        audio_type: string[];
        category: string[];
    }>({ speaker: [], language: [], audio_type: [], category: [] });

    useMemo(() => {
        supabase.from('taxonomies').select('*').then(({ data }) => {
            if (data) {
                setTaxonomies({
                    speaker: data.filter(t => t.type === 'speaker').map(t => t.name),
                    language: data.filter(t => t.type === 'language').map(t => t.name),
                    audio_type: data.filter(t => t.type === 'audio_type').map(t => t.name),
                    category: data.filter(t => t.type === 'category').map(t => t.name),
                });
            }
        });
    }, []);

    const [newFile, setNewFile] = useState<File | null>(null);
    const [newCoverImage, setNewCoverImage] = useState<File | null>(null);

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
        }
    }, [content, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;
        setIsSubmitting(true);
        try {
            const updatePayload = {
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

            await editContent(content.id, content.status, updatePayload, newFile, newCoverImage, content.title, content.file_url, 'audio');
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
                    <DialogTitle>{t('dashboard.myContent.edit.title')} (آڈیو)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 md:col-span-3">
                            <Label>{t('dashboard.upload.fileLabel')} <span className="text-destructive">*</span></Label>
                            <div className="border-2 border-dashed border-border rounded-lg px-4 text-center h-[110px] flex items-center justify-center">
                                <input id="edit-audio-file" type="file" accept=".mp3,.wav,.ogg,.m4a" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="hidden" />
                                <label htmlFor="edit-audio-file" className="cursor-pointer w-full text-sm text-muted-foreground flex flex-col items-center gap-1">
                                    <Headphones className="h-5 w-5" />
                                    <span className="max-w-[80%] truncate text-center font-medium">
                                        {newFile ? newFile.name : (content?.title || t('dashboard.upload.clickToUpload', { type: t('nav.audio') }))}
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
                                <input id="edit-audio-cover" type="file" accept="image/*" onChange={(e) => setNewCoverImage(e.target.files?.[0] || null)} className="hidden" />
                                <label htmlFor="edit-audio-cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                                    {newCoverImage ? <img src={URL.createObjectURL(newCoverImage)} className="w-full h-full object-cover" /> :
                                        (content?.cover_image_url ? <img src={content.cover_image_url} className="w-full h-full object-cover" /> : <Upload className="h-5 w-5" />)}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.titleLabel')} <span className="text-destructive">*</span></Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>{t('dashboard.upload.langLabel')} <span className="text-destructive">*</span></Label>
                        <TaxonomyCombobox options={taxonomies.language} value={language} onChange={setLanguage} />
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
                                        <Checkbox id="e-v-manual" checked={venueManual} onCheckedChange={(v) => setVenueManual(!!v)} />
                                        <Label htmlFor="e-v-manual" className="text-xs cursor-pointer">{t('dashboard.upload.venueManualLabel')}</Label>
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
                                <TaxonomyCombobox options={taxonomies.speaker} value={speaker} onChange={setSpeaker} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('dashboard.upload.audioTypeLabel')} <span className="text-destructive">*</span></Label>
                                <TaxonomyCombobox options={taxonomies.audio_type} value={audioType} onChange={setAudioType} />
                            </div>
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

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">{t('common.cancel')}</Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> {t('dashboard.myContent.edit.save')}</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
}
