/** Shared TypeScript types for content from Supabase */

export type ContentType = 'book' | 'audio' | 'video';

export interface ContentItem {
    id: string;
    title: string;
    description: string | null;
    author: string | null;
    type: ContentType;
    language: string | null;
    tags: string[] | null;
    file_url: string | null;
    cover_image_url: string | null;
    published_at: string | null;
}
