import { supabase } from './supabase';
import type { ContentItem } from './types';

/**
 * Generate a signed URL for a file in the content-files bucket.
 * Returns the original URL if it's already an absolute HTTP/HTTPS URL.
 */
export async function getSignedUrl(path: string | null): Promise<string | null> {
    if (!path) return null;
    if (path.startsWith('http') || path.includes('://')) return path;

    try {
        const { data, error } = await supabase.storage.from('content-files').createSignedUrl(path, 3600);
        if (error) {
            console.error('Error creating signed URL:', error);
            return path;
        }
        return data?.signedUrl || path;
    } catch (error) {
        console.error('Error creating signed URL:', error);
        return path;
    }
}

/**
 * Appends signed URLs to an array of content items.
 * Mutates the items (shallowly) to replace relative paths with signed URLs.
 */
export async function withSignedUrls(items: ContentItem[]): Promise<ContentItem[]> {
    return Promise.all(
        items.map(async (item) => {
            const [signedFile, signedCover] = await Promise.all([
                getSignedUrl(item.file_url),
                getSignedUrl(item.cover_image_url),
            ]);
            return {
                ...item,
                file_url: signedFile,
                cover_image_url: signedCover,
            };
        })
    );
}
