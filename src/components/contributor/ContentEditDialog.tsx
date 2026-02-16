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
    }
  }, [content]);

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
          admin_notes: newStatus === 'pending' ? null : undefined, // Clear admin notes on resubmit
        })
        .eq('id', content.id);

      if (error) throw error;

      // Rename in Google Drive if title changed and it's a Drive file
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
      <DialogContent className="sm:max-w-[500px]">
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