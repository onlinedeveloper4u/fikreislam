import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { renameInGoogleDrive } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { X, Upload, FileText, Headphones, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpload } from '@/contexts/UploadContextTypes';
import { TaxonomyCombobox } from './TaxonomyCombobox';
import { formatBytes } from '@/lib/utils';

type ContentType = 'book' | 'audio' | 'video';
type ContentStatus = 'pending' | 'approved' | 'rejected';

interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  author: string | null;
  language: string | null;
  tags: string[] | null;
  status: ContentStatus;
  file_url: string | null;
  cover_image_url: string | null;
  duration: string | null;
  venue: string | null;
  speaker: string | null;
  audio_type: string | null;
  categories: string[] | null;
  lecture_date_gregorian: string | null;
  hijri_date_day: number | null;
  hijri_date_month: string | null;
  hijri_date_year: number | null;
}

interface ContentEditDialogProps {
  content: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContentEditDialog({ content, open, onOpenChange, onSuccess }: ContentEditDialogProps) {
  const { t } = useTranslation();
  const { editContent } = useUpload();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('اردو');
  const [tags, setTags] = useState('');

  // Audio expanded metadata
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

  // Taxonomy State
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

  // File replacement state
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null);

  // Date parts
  const [gDay, setGDay] = useState('');
  const [gMonth, setGMonth] = useState('');
  const [gYear, setGYear] = useState('');
  const [hDay, setHDay] = useState('');
  const [hMonth, setHMonth] = useState('');
  const [hYear, setHYear] = useState('');

  const DatePartSelect = ({
    type,
    value,
    onChange,
    placeholder,
    monthType
  }: {
    type: 'day' | 'month' | 'year',
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    monthType?: 'gregorian' | 'hijri'
  }) => {
    const items = useMemo(() => {
      if (type === 'day') {
        const length = monthType === 'hijri' ? 30 : 31;
        return Array.from({ length }, (_, i) => (i + 1).toString());
      }
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
        <SelectTrigger className="flex-1">
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

  const contentSchema = useMemo(() => z.object({
    title: z.string().trim()
      .min(1, t('dashboard.upload.validation.titleRequired'))
      .max(200, t('dashboard.upload.validation.titleTooLong')),
    description: z.string().trim()
      .max(2000, t('dashboard.upload.validation.descTooLong'))
      .optional().transform(val => val || ''),
    author: z.string().trim()
      .max(200, t('dashboard.upload.validation.authorTooLong'))
      .optional().transform(val => val || ''),
    language: z.string(),
    tags: z.string().transform(val =>
      val.split(',').map(t => t.trim().slice(0, 50)).filter(Boolean).slice(0, 20)
    ),
  }), [t]);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setDescription(content.description || '');
      setAuthor(content.author || '');
      setLanguage(content.language || 'اردو');
      setTags(content.tags?.join(', ') || '');

      // Audio metadata
      if (content.duration) {
        const parts = content.duration.split(':').map(Number);
        setDurHours(parts[0]?.toString() || '');
        setDurMinutes(parts[1]?.toString() || '');
        setDurSeconds(parts[2]?.toString() || '');
      } else {
        setDurHours(''); setDurMinutes(''); setDurSeconds('');
      }

      if (content.venue) {
        const parts = content.venue.split(',').map(p => p.trim());
        if (parts.length > 0 && ['ضلع', 'تحصیل', 'شہر', 'علاقہ'].some(kw => content.venue!.includes(kw)) === false) {
          if (parts.length >= 4) {
            setVenueDistrict(parts[0]);
            setVenueTehsil(parts[1]);
            setVenueCity(parts[2]);
            setVenueArea(parts[3] || '');
            setVenueManual(false);
          } else {
            setVenueText(content.venue);
            setVenueManual(true);
          }
        } else {
          setVenueText(content.venue);
          setVenueManual(true);
        }
      } else {
        setVenueText('');
        setVenueManual(false);
      }

      setSpeaker(content.speaker || '');
      setAudioType(content.audio_type || '');
      setCategories(content.categories?.join(', ') || '');

      if (content.lecture_date_gregorian) {
        const [y, m, d] = content.lecture_date_gregorian.split('-');
        setGYear(y); setGMonth(parseInt(m).toString()); setGDay(parseInt(d).toString());
      } else {
        setGYear(''); setGMonth(''); setGDay('');
      }

      setHDay(content.hijri_date_day?.toString() || '');
      setHMonth(content.hijri_date_month || '');
      setHYear(content.hijri_date_year?.toString() || '');
    }
  }, [content, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setNewFile(selectedFile);

    if (selectedFile && content?.type === 'audio') {
      // Auto-fill Title from Filename if title is empty or if it was the same as previous file name hint
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);

      // Extract Duration
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(selectedFile);
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        const duration = Math.floor(audio.duration);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;

        setDurHours(hours > 0 ? hours.toString() : '');
        setDurMinutes(minutes.toString());
        setDurSeconds(seconds.toString());

        URL.revokeObjectURL(objectUrl);
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content) return;

    const validationResult = contentSchema.safeParse({
      title,
      description,
      author,
      language,
      tags,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validationResult.data;

    // Validate Audio specific fields
    if (content.type === 'audio') {
      const hasDuration = [durHours, durMinutes, durSeconds].some(p => p !== '' && p !== '0' && p !== '00');
      if (!hasDuration) {
        toast.error(t('dashboard.upload.validation.durationRequired', { defaultValue: 'Duration is required' }));
        return;
      }
      if (!speaker) {
        toast.error(t('dashboard.upload.validation.speakerRequired', { defaultValue: 'Speaker is required' }));
        return;
      }
      if (!audioType) {
        toast.error(t('dashboard.upload.validation.audioTypeRequired', { defaultValue: 'Audio Type is required' }));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const newStatus = content.status === 'rejected' ? 'pending' : content.status;

      const updatePayload: any = {
        title: validatedData.title,
        description: validatedData.description || null,
        author: validatedData.author || null,
        language: validatedData.language,
        tags: validatedData.tags,
        status: newStatus,
        admin_notes: newStatus === 'pending' ? null : undefined,
        cover_image_url: content.cover_image_url || null,
      };

      if (content.type === 'audio') {
        const formattedDuration = [
          durHours.padStart(2, '0') || '00',
          durMinutes.padStart(2, '0') || '00',
          durSeconds.padStart(2, '0') || '00'
        ].join(':');

        const formattedVenue = venueManual
          ? venueText || null
          : [venueDistrict, venueTehsil, venueCity, venueArea].filter(Boolean).join(', ') || null;

        Object.assign(updatePayload, {
          duration: formattedDuration,
          venue: formattedVenue,
          speaker: speaker || null,
          audio_type: audioType || null,
          categories: categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [],
          lecture_date_gregorian: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
          hijri_date_day: hDay ? parseInt(hDay) : null,
          hijri_date_month: hMonth || null,
          hijri_date_year: hYear ? parseInt(hYear) : null,
        });
      }

      await editContent(
        content.id,
        content.status,
        updatePayload,
        newFile,
        newCoverImage,
        content.title,
        content.file_url,
        content.type
      );

      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Update error:', e);
      toast.error(e.message || t('dashboard.myContent.edit.loadFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dashboard.myContent.edit.title')}</DialogTitle>
          <DialogDescription>
            {content?.status === 'rejected'
              ? t('dashboard.myContent.edit.resubmitDesc')
              : t('dashboard.myContent.edit.updateDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File and Cover Image Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="edit-file-upload">{t('dashboard.upload.fileLabel')} <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">{t('dashboard.upload.fileHint')}</span></Label>
              <div className="border-2 border-dashed border-border rounded-lg px-4 text-center hover:border-primary/50 transition-colors h-[110px] flex items-center justify-center">
                <input
                  id="edit-file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="audio/*,video/*,application/pdf"
                />
                <label htmlFor="edit-file-upload" className="cursor-pointer w-full">
                  <div className="flex flex-col items-center gap-1">
                    {content?.type === 'audio' ? <Headphones className="h-6 w-6 text-primary" /> : <FileText className="h-6 w-6 text-primary" />}
                    {(newFile || content?.file_url) && (
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground max-w-full truncate px-4" dir="ltr">
                          {newFile ? newFile.name : (content?.file_url ? content.file_url.split('/').pop()?.split('?')[0] : '')}
                        </span>
                        {newFile && (
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {formatBytes(newFile.size)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {content?.type === 'audio' ? '.mp3, .wav' : '.pdf, .mp4'}
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-1 flex flex-col items-center">
              <Label htmlFor="edit-cover-upload" className="w-full text-center">
                {t('dashboard.upload.coverLabel')}
                <span className="text-xs text-muted-foreground block text-[10px] mt-0.5 leading-tight">{t('dashboard.upload.coverHint')}</span>
              </Label>
              <div className="border-2 border-dashed border-border rounded-full hover:border-primary/50 transition-colors h-[110px] w-[110px] flex items-center justify-center overflow-hidden p-0 relative">
                <input
                  id="edit-cover-upload"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewCoverImage(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept="image/*"
                />
                <label htmlFor="edit-cover-upload" className="cursor-pointer w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    {(newCoverImage || content?.cover_image_url) ? (
                      <div className="w-full h-full">
                        {newCoverImage ? (
                          <img src={URL.createObjectURL(newCoverImage)} alt="New cover preview" className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={`${content?.cover_image_url}`}
                            alt="Current cover"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">{t('dashboard.upload.titleLabel')} <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">{t('dashboard.upload.titleHint')}</span></Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          {content?.type !== 'audio' && (
            <div className="space-y-2">
              <Label htmlFor="edit-author">{t('dashboard.upload.authorLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.titleHint')}</span></Label>
              <Input
                id="edit-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={200}
              />
            </div>
          )}

          {content?.type !== 'audio' && (
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('dashboard.upload.descLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.descHint')}</span></Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-language">{t('dashboard.upload.langLabel')} <span className="text-red-500">*</span></Label>
            <TaxonomyCombobox
              options={taxonomies.language}
              value={language}
              onChange={setLanguage}
              placeholder={t('dashboard.upload.langPlaceholder')}
            />
          </div>

          {content?.type !== 'audio' && (
            <div className="space-y-2">
              <Label htmlFor="edit-tags">{t('dashboard.upload.tagsLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.tagsHint')}</span></Label>
              <Input
                id="edit-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('dashboard.upload.tagsPlaceholder')}
              />
            </div>
          )}

          {content?.type === 'audio' && (
            <div className="space-y-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('dashboard.upload.durationLabel')} <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2" dir="ltr">
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={durHours}
                      onChange={(e) => setDurHours(e.target.value)}
                      placeholder="HH"
                      className="text-center"
                    />
                    <span className="flex items-center">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={durMinutes}
                      onChange={(e) => setDurMinutes(e.target.value)}
                      placeholder="MM"
                      className="text-center"
                    />
                    <span className="flex items-center">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={durSeconds}
                      onChange={(e) => setDurSeconds(e.target.value)}
                      placeholder="SS"
                      className="text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('dashboard.upload.venueLabel')}</Label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id="edit-venue-manual"
                        checked={venueManual}
                        onChange={(e) => setVenueManual(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="edit-venue-manual" className="text-sm font-medium leading-none cursor-pointer">
                        {t('dashboard.upload.venueManualLabel', { defaultValue: 'اکٹھا ٹائپ کریں' })}
                      </label>
                    </div>
                  </div>
                  {venueManual ? (
                    <Input
                      value={venueText}
                      onChange={(e) => setVenueText(e.target.value)}
                      placeholder={t('dashboard.upload.venuePlaceholder')}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={venueDistrict}
                        onChange={(e) => setVenueDistrict(e.target.value)}
                        placeholder={t('dashboard.upload.venueDistrict', { defaultValue: 'ضلع' })}
                      />
                      <Input
                        value={venueTehsil}
                        onChange={(e) => setVenueTehsil(e.target.value)}
                        placeholder={t('dashboard.upload.venueTehsil', { defaultValue: 'تحصیل' })}
                      />
                      <Input
                        value={venueCity}
                        onChange={(e) => setVenueCity(e.target.value)}
                        placeholder={t('dashboard.upload.venueCity', { defaultValue: 'شہر / گاؤں' })}
                      />
                      <Input
                        value={venueArea}
                        onChange={(e) => setVenueArea(e.target.value)}
                        placeholder={t('dashboard.upload.venueArea', { defaultValue: 'علاقہ / مسجد' })}
                      />
                    </div>
                  )}
                </div>
              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-speaker">{t('dashboard.upload.speakerLabel')} <span className="text-red-500">*</span></Label>
                  <TaxonomyCombobox
                    options={taxonomies.speaker}
                    value={speaker}
                    onChange={setSpeaker}
                    placeholder={t('dashboard.upload.speakerPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-audioType">{t('dashboard.upload.audioTypeLabel')} <span className="text-red-500">*</span></Label>
                  <TaxonomyCombobox
                    options={taxonomies.audio_type}
                    value={audioType}
                    onChange={setAudioType}
                    placeholder={t('dashboard.upload.audioTypePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-categories">{t('dashboard.upload.categoriesLabel')}</Label>
                <TaxonomyCombobox
                  options={taxonomies.category}
                  value={categories}
                  onChange={setCategories}
                  placeholder={t('dashboard.upload.categoriesPlaceholder')}
                />
              </div>
            </div>
          )}




          {/* Dates */}
          <div className="space-y-4 pt-4 border-t">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {content?.status === 'rejected' ? t('dashboard.myContent.edit.resubmit') : t('dashboard.myContent.edit.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}