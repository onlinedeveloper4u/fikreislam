import { useState } from 'react';
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

type ContentType = 'book' | 'audio' | 'video';

const LANGUAGES = ['English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish'];

// Validation schema for content upload
const contentSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .transform(val => val || ''),
  author: z.string()
    .trim()
    .max(200, 'Author name must be less than 200 characters')
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
});

// File type validation
const ALLOWED_FILE_TYPES: Record<ContentType, string[]> = {
  book: ['application/pdf', 'application/epub+zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File, contentType: ContentType): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 500MB';
  }
  
  const allowedTypes = ALLOWED_FILE_TYPES[contentType];
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types for ${contentType}: ${getAcceptedFileTypesStatic(contentType)}`;
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
    return `File extension (.${extension}) does not match file type. This could indicate a tampered file.`;
  }
  
  return null;
}

function validateImage(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE) {
    return 'Cover image must be less than 10MB';
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP';
  }
  
  return null;
}

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
      toast.error('You must be logged in to upload content');
      return;
    }

    if (!file) {
      toast.error('Please select a file to upload');
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
      // Upload main file with sanitized path
      const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      const filePath = `${user.id}/${contentType}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store just the file path, not the full URL
      // Signed URLs will be generated dynamically when accessing the file
      const fileUrlPath = filePath;

      // Upload cover image if provided
      let coverImagePath = null;
      if (coverImage) {
        const coverExt = coverImage.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const coverPath = `${user.id}/covers/${Date.now()}.${coverExt}`;
        
        const { error: coverError } = await supabase.storage
          .from('content-files')
          .upload(coverPath, coverImage);

        if (coverError) throw coverError;

        // Store just the path, not the full URL
        coverImagePath = coverPath;
      }

      // Insert content record with validated data
      // Admins get auto-approved, contributors need review
      const { error: insertError } = await supabase
        .from('content')
        .insert({
          contributor_id: user.id,
          type: validatedData.contentType,
          title: validatedData.title,
          description: validatedData.description || null,
          author: validatedData.author || null,
          language: validatedData.language,
          tags: validatedData.tags,
          file_url: fileUrlPath,
          cover_image_url: coverImagePath,
          status: isAdmin ? 'approved' : 'pending',
          published_at: isAdmin ? new Date().toISOString() : null,
        });

      if (insertError) throw insertError;

      toast.success(isAdmin 
        ? 'Content uploaded and published successfully!' 
        : 'Content uploaded successfully! It will be reviewed by an admin.');
      
      // Reset form
      setTitle('');
      setDescription('');
      setAuthor('');
      setLanguage('English');
      setTags('');
      setFile(null);
      setCoverImage(null);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload New Content
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'Upload content directly. Your uploads will be published immediately.'
            : 'Submit your content for review. Once approved by an admin, it will be published.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label>Content Type</Label>
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
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title * <span className="text-xs text-muted-foreground">(max 200 chars)</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              maxLength={200}
              required
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author / Speaker <span className="text-xs text-muted-foreground">(max 200 chars)</span></Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author or speaker name"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-xs text-muted-foreground">(max 2000 chars)</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the content..."
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated) <span className="text-xs text-muted-foreground">(max 20 tags)</span></Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., Quran, Tafsir, Fiqh"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Content File * <span className="text-xs text-muted-foreground">(max 500MB)</span></Label>
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
                    {file ? file.name : `Click to upload ${contentType} file`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Accepted: {getAcceptedFileTypes()}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image (optional) <span className="text-xs text-muted-foreground">(max 10MB)</span></Label>
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
                    {coverImage ? coverImage.name : 'Click to upload cover image'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {isAdmin ? 'Upload & Publish' : 'Submit for Review'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
