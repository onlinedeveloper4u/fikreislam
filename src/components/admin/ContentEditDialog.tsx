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
import { Loader2, Save } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

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

const LANGUAGES = ['English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish'];

export function ContentEditDialog({ content, open, onOpenChange, onSuccess }: ContentEditDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('English');
  const [tags, setTags] = useState('');

  // Audio expanded metadata
  const [duration, setDuration] = useState('');
  const [venue, setVenue] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [audioType, setAudioType] = useState('');
  const [categories, setCategories] = useState('');

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
      setLanguage(content.language || 'English');
      setTags(content.tags?.join(', ') || '');

      // Audio metadata
      setDuration(content.duration || '');
      setVenue(content.venue || '');
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
    setIsSubmitting(true);

    try {
      // If content was rejected, resubmit as pending
      const newStatus = content.status === 'rejected' ? 'pending' : content.status;

      const { error } = await supabase
        .from('content')
        .update({
          title: validatedData.title,
          description: validatedData.description || null,
          author: validatedData.author || null,
          language: validatedData.language,
          tags: validatedData.tags,
          status: newStatus,
          admin_notes: newStatus === 'pending' ? null : undefined,
          // Audio specialized metadata
          duration: duration || null,
          venue: venue || null,
          speaker: speaker || null,
          audio_type: audioType || null,
          categories: categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [],
          lecture_date_gregorian: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
          hijri_date_day: hDay ? parseInt(hDay) : null,
          hijri_date_month: hMonth || null,
          hijri_date_year: hYear ? parseInt(hYear) : null,
        })
        .eq('id', content.id);

      if (error) throw error;

      // Rename in Google Drive if title changed and it's a Drive file (Existing scenario)
      if (content.title !== validatedData.title && content.file_url?.startsWith('google-drive://')) {
        await renameInGoogleDrive(content.file_url, validatedData.title);
      }

      const message = content.status === 'rejected'
        ? t('dashboard.myContent.edit.resubmitSuccess')
        : t('dashboard.myContent.edit.updateSuccess');

      toast.success(message);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || t('dashboard.myContent.edit.loadFailed'));
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
          <div className="space-y-2">
            <Label htmlFor="edit-title">{t('dashboard.upload.titleLabel')}</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-author">{t('dashboard.upload.authorLabel')}</Label>
            <Input
              id="edit-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">{t('dashboard.upload.descLabel')}</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('dashboard.upload.langLabel')}</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">{t('dashboard.upload.tagsLabel')}</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('dashboard.upload.tagsPlaceholder')}
            />
          </div>

          {content?.type === 'audio' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">{t('dashboard.upload.durationLabel')}</Label>
                  <Input
                    id="edit-duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={t('dashboard.upload.durationPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-venue">{t('dashboard.upload.venueLabel')}</Label>
                  <Input
                    id="edit-venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder={t('dashboard.upload.venuePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-speaker">{t('dashboard.upload.speakerLabel')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-speaker"
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder={t('dashboard.upload.speakerPlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-audioType">{t('dashboard.upload.audioTypeLabel')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-audioType"
                    value={audioType}
                    onChange={(e) => setAudioType(e.target.value)}
                    placeholder={t('dashboard.upload.audioTypePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-categories">{t('dashboard.upload.categoriesLabel')} <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-categories"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder={t('dashboard.upload.categoriesPlaceholder')}
                  required
                />
              </div>
            </div>
          )}

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