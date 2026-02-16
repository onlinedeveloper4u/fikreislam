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
import { Upload, FileText, Music, Video, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { useUpload } from '@/contexts/UploadContextTypes';
import { useNavigate } from 'react-router-dom';

type ContentType = 'book' | 'audio' | 'video';

const LANGUAGES = ['English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish'];

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

export function ContentUploadForm() {
  const { user, role } = useAuth();
  const { uploadContent } = useUpload();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAdmin = role === 'admin';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('book');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('English');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [useGoogleDrive, setUseGoogleDrive] = useState(true);

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
    language: z.enum(['English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish']),
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
      // Create a plain object for the hook to consume (FormData might be tricky with serialization if needed, but here we just pass fields)
      const uploadData = {
        ...validatedData,
        useGoogleDrive,
        tags: tags, // Passing raw tags string to let the context handle parsing
      };

      // Trigger background upload
      uploadContent(uploadData, file, coverImage);

      toast.info(t('dashboard.upload.started', { defaultValue: 'Upload started in background' }));

      // Reset form immediately
      setTitle('');
      setDescription('');
      setAuthor('');
      setLanguage('English');
      setTags('');
      setFile(null);
      setCoverImage(null);

      // Optionally redirect to library or stay on dashboard
      // navigate('/library');

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
          {isAdmin
            ? t('dashboard.upload.adminDesc')
            : t('dashboard.upload.contributorDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Storage Provider Toggle */}
          <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-muted/30">
            <div className="flex flex-col gap-1">
              <Label htmlFor="google-drive-mode" className="font-semibold cursor-pointer">
                {t('dashboard.upload.useGoogleDrive', { defaultValue: 'Upload to Google Drive' })}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.upload.googleDriveHint', { defaultValue: 'Files will be stored in Google Drive instead of Supabase' })}
              </p>
            </div>
            <Switch
              id="google-drive-mode"
              checked={useGoogleDrive}
              onCheckedChange={setUseGoogleDrive}
            />
          </div>

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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('dashboard.upload.titleLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.titleHint')}</span></Label>
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

          {/* Description */}
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

          {/* Language */}
          <div className="space-y-2">
            <Label>{t('dashboard.upload.langLabel')}</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder={t('dashboard.upload.langPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{t(`common.languages.${lang}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">{t('dashboard.upload.tagsLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.tagsHint')}</span></Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('dashboard.upload.tagsPlaceholder')}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">{t('dashboard.upload.fileLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.fileHint')}</span></Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                id="file"
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  {getContentIcon()}
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : t('dashboard.upload.clickToUpload', { type: t(`nav.${contentType === 'book' ? 'books' : contentType}`).toLowerCase() })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('dashboard.upload.accepted', { types: getAcceptedFileTypes() })}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="cover">{t('dashboard.upload.coverLabel')} <span className="text-xs text-muted-foreground">{t('dashboard.upload.coverHint')}</span></Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="cover" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm text-muted-foreground">
                    {coverImage ? coverImage.name : t('dashboard.upload.coverPlaceholder')}
                  </span>
                </div>
              </label>
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
                {isAdmin ? t('dashboard.upload.submitAdmin') : t('dashboard.upload.submitContributor')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
