import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { cn, formatBytes } from '@/lib/utils';
import {
  Upload, FileText, Music, Video, Loader2,
  Check, X, Save, Headphones
} from 'lucide-react';

import { useUpload } from '@/contexts/UploadContextTypes';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { TaxonomyCombobox } from './TaxonomyCombobox';

type ContentType = 'book' | 'audio' | 'video';

// File type validation
const ALLOWED_FILE_TYPES: Record<ContentType, string[]> = {
  book: ['application/pdf', 'application/epub+zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

function getAcceptedFileTypesStatic(type: ContentType): string {
  switch (type) {
    case 'book': return '.pdf,.epub,.doc,.docx';
    case 'audio': return '.mp3,.wav,.ogg,.m4a';
    case 'video': return '.mp4,.webm,.mov';
    default: return '*';
  }
}

interface ContentUploadFormProps {
  onSuccess?: () => void;
}

export function ContentUploadForm({ onSuccess }: ContentUploadFormProps) {
  const { user, role } = useAuth();
  const { uploadContent } = useUpload();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAdmin = role === 'admin';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('audio');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('اردو');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);


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

  // Expanded Audio Metadata
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
  const [categories, setCategories] = useState(''); // Comma separated for now

  // Date Parts
  const [gDay, setGDay] = useState('');
  const [gMonth, setGMonth] = useState('');
  const [gYear, setGYear] = useState('');
  const [hDay, setHDay] = useState('');
  const [hMonth, setHMonth] = useState('');
  const [hYear, setHYear] = useState('');

  // Helper for Date Selection
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
      if (type === 'month') {
        return Array.from({ length: 12 }, (_, i) => (i + 1).toString());
      }
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
              {type === 'month' && monthType
                ? t(`common.months.${monthType}.${item}`)
                : item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Validation schema for content upload
  const contentSchema = useMemo(() => z.object({
    title: z.string()
      .trim()
      .min(1, t('dashboard.upload.validation.titleRequired'))
      .max(200, t('dashboard.upload.validation.titleTooLong')),
    description: z.string()
      .trim()
      .max(2000, t('dashboard.upload.validation.descTooLong'))
      .optional()
      .transform(val => val || ''),
    author: z.string()
      .trim()
      .max(200, t('dashboard.upload.validation.authorTooLong'))
      .optional()
      .transform(val => val || ''),
    language: z.string().min(1, t('dashboard.upload.validation.langRequired', { defaultValue: 'Language is required' })),
    tags: z.string()
      .transform(val =>
        val.split(',')
          .map(t => t.trim().slice(0, 50)) // Limit each tag to 50 chars
          .filter(Boolean)
          .slice(0, 20) // Max 20 tags
      ),
    contentType: z.enum(['book', 'audio', 'video']),
  }), [t]);

  function validateFile(file: File, contentType: ContentType): string | null {
    if (file.size > MAX_FILE_SIZE) {
      return t('dashboard.upload.errorFileTooLarge');
    }

    const allowedTypes = ALLOWED_FILE_TYPES[contentType];
    if (!allowedTypes.includes(file.type)) {
      return t('dashboard.upload.errorInvalidType', { type: contentType, allowed: getAcceptedFileTypesStatic(contentType) });
    }

    // Additional MIME type validation - check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypeExtensionMap: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/epub+zip': ['epub'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'audio/mpeg': ['mp3'],
      'audio/wav': ['wav'],
      'audio/ogg': ['ogg'],
      'audio/mp4': ['m4a', 'mp4'],
      'audio/x-m4a': ['m4a'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'video/quicktime': ['mov'],
    };

    const expectedExtensions = mimeTypeExtensionMap[file.type];
    if (expectedExtensions && extension && !expectedExtensions.includes(extension)) {
      return t('common.error'); // Fallback to a general error if literal matching is too complex for UI localization right now
    }

    return null;
  }

  function validateImage(file: File): string | null {
    if (file.size > MAX_IMAGE_SIZE) {
      return t('dashboard.upload.errorImageTooLarge');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return t('dashboard.upload.errorInvalidImage');
    }

    return null;
  }

  const getAcceptedFileTypes = () => getAcceptedFileTypesStatic(contentType);

  const getContentIcon = () => {
    switch (contentType) {
      case 'book': return <FileText className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      // Auto-fill Title from Filename
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);

      if (contentType === 'audio') {
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t('dashboard.upload.errorLogin'));
      return;
    }

    if (!file) {
      toast.error(t('dashboard.upload.errorNoFile'));
      return;
    }

    // Validate form data with zod
    const validationResult = contentSchema.safeParse({
      title,
      description,
      author,
      language,
      tags,
      contentType,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    // Validate file type and size
    const fileError = validateFile(file, contentType);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    // Validate cover image if provided
    if (coverImage) {
      const imageError = validateImage(coverImage);
      if (imageError) {
        toast.error(imageError);
        return;
      }
    }

    const validatedData = validationResult.data;
    setIsSubmitting(true);

    try {
      // Audio specific validation for mandatory fields
      if (contentType === 'audio') {
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

      // Create a plain object for the hook to consume
      const uploadData = {
        ...validatedData,
        useGoogleDrive: true,
        tags: tags,
        // Audio specific metadata
        duration: [
          durHours.padStart(2, '0') || '00',
          durMinutes.padStart(2, '0') || '00',
          durSeconds.padStart(2, '0') || '00'
        ].join(':'),
        venue: venueManual ? venueText || null : [venueDistrict, venueTehsil, venueCity, venueArea].filter(Boolean).join(', ') || null,
        speaker,
        audioType,
        categoriesValue: categories,
        gDate: gYear && gMonth && gDay ? `${gYear}-${gMonth.padStart(2, '0')}-${gDay.padStart(2, '0')}` : null,
        hDay: hDay ? parseInt(hDay) : null,
        hMonth: hMonth ? parseInt(hMonth) : null,
        hYear: hYear ? parseInt(hYear) : null,
      };

      // Trigger background upload
      uploadContent(uploadData, file, coverImage);

      toast.info(t('dashboard.upload.started', { defaultValue: 'Upload started in background' }));

      // Reset form immediately
      setTitle('');
      setDescription('');
      setAuthor('');
      setLanguage('اردو');
      setTags('');
      setFile(null);
      setCoverImage(null);
      setDurHours('');
      setDurMinutes('');
      setDurSeconds('');
      setVenueManual(false);
      setVenueText('');
      setVenueDistrict('');
      setVenueTehsil('');
      setVenueCity('');
      setVenueArea('');
      setSpeaker('');
      setAudioType('');
      setCategories('');
      setGDay(''); setGMonth(''); setGYear('');
      setHDay(''); setHMonth(''); setHYear('');

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Enqueue error:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          {t('dashboard.upload.title')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.upload.adminDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">


          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label>{t('dashboard.upload.typeLabel')}</Label>
            <div className="flex gap-2">
              {(['book', 'audio', 'video'] as ContentType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={contentType === type ? 'default' : 'outline'}
                  onClick={() => setContentType(type)}
                  className="flex-1 capitalize"
                >
                  {type === 'book' && <FileText className="mr-2 h-4 w-4" />}
                  {type === 'audio' && <Music className="mr-2 h-4 w-4" />}
                  {type === 'video' && <Video className="mr-2 h-4 w-4" />}
                  {t(`nav.${type === 'book' ? 'books' : type}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* File and Cover Image Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* File Upload */}
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="file">{t('dashboard.upload.fileLabel')} <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">{t('dashboard.upload.fileHint')}</span></Label>
              <div className="border-2 border-dashed border-border rounded-lg px-4 text-center hover:border-primary/50 transition-colors h-[110px] flex items-center justify-center">
                <input
                  id="file"
                  type="file"
                  accept={getAcceptedFileTypes()}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer w-full">
                  <div className="flex flex-col items-center gap-1">
                    {getContentIcon()}
                    <span className="text-sm text-muted-foreground max-w-full truncate px-4">
                      {file ? file.name : t('dashboard.upload.clickToUpload', { type: t(`nav.${contentType === 'book' ? 'books' : contentType}`).toLowerCase() })}
                    </span>
                    {file && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.upload.accepted', { types: getAcceptedFileTypes() })}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2 md:col-span-1 flex flex-col items-center">
              <Label htmlFor="cover" className="w-full text-center">
                {t('dashboard.upload.coverLabel')}
                <span className="text-xs text-muted-foreground block text-[10px] mt-0.5 leading-tight">{t('dashboard.upload.coverHint')}</span>
              </Label>
              <div className="border-2 border-dashed border-border rounded-full hover:border-primary/50 transition-colors h-[110px] w-[110px] flex items-center justify-center overflow-hidden p-0 relative">
                <input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="cover" className="cursor-pointer w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    {coverImage ? (
                      <div className="w-full h-full">
                        <img src={URL.createObjectURL(coverImage)} alt="Cover preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('dashboard.upload.titleLabel')} <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">{t('dashboard.upload.titleHint')}</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('dashboard.upload.titlePlaceholder')}
              maxLength={200}
              required
            />
          </div>

          {/* Author */}
          {contentType !== 'audio' && (
            <div className="space-y-2">
              <Label htmlFor="author">{t('dashboard.upload.authorLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.titleHint')}</span></Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={t('dashboard.upload.authorPlaceholder')}
                maxLength={200}
              />
            </div>
          )}

          {/* Description */}
          {contentType !== 'audio' && (
            <div className="space-y-2">
              <Label htmlFor="description">{t('dashboard.upload.descLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.descHint')}</span></Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('dashboard.upload.descPlaceholder')}
                rows={4}
                maxLength={2000}
              />
            </div>
          )}

          {/* Language */}
          <div className="space-y-2">
            <Label>{t('dashboard.upload.langLabel')} <span className="text-red-500">*</span></Label>
            <TaxonomyCombobox
              options={taxonomies.language}
              value={language}
              onChange={setLanguage}
              placeholder={t('dashboard.upload.langPlaceholder')}
            />
          </div>

          {/* Audio Specific Fields */}
          {contentType === 'audio' && (
            <div className="space-y-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('dashboard.upload.durationLabel')} <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2" dir="ltr">
                    <Input type="number" min="0" max="99" placeholder="HH" value={durHours} onChange={(e) => setDurHours(e.target.value)} className="text-center" />
                    <span className="flex items-center">:</span>
                    <Input type="number" min="0" max="59" placeholder="MM" value={durMinutes} onChange={(e) => setDurMinutes(e.target.value)} className="text-center" />
                    <span className="flex items-center">:</span>
                    <Input type="number" min="0" max="59" placeholder="SS" value={durSeconds} onChange={(e) => setDurSeconds(e.target.value)} className="text-center" />
                  </div>
                </div>

                {/* Venue */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('dashboard.upload.venueLabel')}</Label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox id="venue-manual" checked={venueManual} onCheckedChange={(v) => setVenueManual(!!v)} className="h-4 w-4" />
                      <label htmlFor="venue-manual" className="text-sm font-medium leading-none cursor-pointer">
                        {t('dashboard.upload.venueManualLabel', { defaultValue: 'اکٹھا ٹائپ کریں' })}
                      </label>
                    </div>
                  </div>
                  {venueManual ? (
                    <Input placeholder={t('dashboard.upload.venuePlaceholder')} value={venueText} onChange={(e) => setVenueText(e.target.value)} />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t('dashboard.upload.venueDistrict', { defaultValue: 'ضلع' })} value={venueDistrict} onChange={(e) => setVenueDistrict(e.target.value)} />
                      <Input placeholder={t('dashboard.upload.venueTehsil', { defaultValue: 'تحصیل' })} value={venueTehsil} onChange={(e) => setVenueTehsil(e.target.value)} />
                      <Input placeholder={t('dashboard.upload.venueCity', { defaultValue: 'شہر / گاؤں' })} value={venueCity} onChange={(e) => setVenueCity(e.target.value)} />
                      <Input placeholder={t('dashboard.upload.venueArea', { defaultValue: 'علاقہ / مسجد' })} value={venueArea} onChange={(e) => setVenueArea(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>



              {/* Speaker and Audio Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speaker">{t('dashboard.upload.speakerLabel')} <span className="text-red-500">*</span></Label>
                  <TaxonomyCombobox
                    options={taxonomies.speaker}
                    value={speaker}
                    onChange={setSpeaker}
                    placeholder={t('dashboard.upload.speakerPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audioType">{t('dashboard.upload.audioTypeLabel')} <span className="text-red-500">*</span></Label>
                  <TaxonomyCombobox
                    options={taxonomies.audio_type}
                    value={audioType}
                    onChange={setAudioType}
                    placeholder={t('dashboard.upload.audioTypePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categories">{t('dashboard.upload.categoriesLabel')}</Label>
                <TaxonomyCombobox
                  options={taxonomies.category}
                  value={categories}
                  onChange={setCategories}
                  placeholder={t('dashboard.upload.categoriesPlaceholder')}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {contentType !== 'audio' && (
            <div className="space-y-2">
              <Label htmlFor="tags">{t('dashboard.upload.tagsLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.tagsHint')}</span></Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('dashboard.upload.tagsPlaceholder')}
              />
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('dashboard.upload.uploading')}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t('dashboard.upload.submitAdmin')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
