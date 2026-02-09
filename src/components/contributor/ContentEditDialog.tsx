import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
}

interface ContentEditDialogProps {
  content: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LANGUAGES = ['English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish'];

const contentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().trim().max(2000, 'Description must be less than 2000 characters').optional().transform(val => val || ''),
  author: z.string().trim().max(200, 'Author name must be less than 200 characters').optional().transform(val => val || ''),
  language: z.string(),
  tags: z.string().transform(val => 
    val.split(',').map(t => t.trim().slice(0, 50)).filter(Boolean).slice(0, 20)
  ),
});

export function ContentEditDialog({ content, open, onOpenChange, onSuccess }: ContentEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('English');
  const [tags, setTags] = useState('');

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

      const message = content.status === 'rejected' 
        ? 'Content updated and resubmitted for review!'
        : 'Content updated successfully!';
      
      toast.success(message);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
          <DialogDescription>
            {content?.status === 'rejected' 
              ? 'Make changes and resubmit for review'
              : 'Update your content details'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-author">Author / Speaker</Label>
            <Input
              id="edit-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
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
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., Quran, Tafsir, Fiqh"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {content?.status === 'rejected' ? 'Resubmit' : 'Save'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}