/**
 * Pure utility functions for Internet Archive identifier parsing and URL resolution.
 * Safe to be imported by BOTH Server and Client Components.
 */

/**
 * Sanitize a filename for safe use in Internet Archive URLs.
 */
export function sanitizeFileName(name: string): string {
    return name
        .replace(/\s+/g, '_')
        .replace(/[^\w.\-\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '_')
        .replace(/_+/g, '_');
}

/**
 * Extract the Internet Archive identifier from a URL.
 */
export function extractIAIdentifier(url: string | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('ia://')) return url.replace('ia://', '').split('/')[0];
    if (url.includes('archive.org/download/')) return url.split('archive.org/download/')[1].split('/')[0];
    if (url.includes('archive.org/details/')) return url.split('archive.org/details/')[1].split('/')[0];
    return undefined;
}

/**
 * Resolve an ia:// URL to a public download URL.
 */
export function resolveIADownloadUrl(iaUrl: string): string {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return '';
    const path = iaUrl.replace('ia://', '');
    const slashIdx = path.indexOf('/');
    if (slashIdx === -1) return `https://archive.org/download/${path}`;
    const id = path.substring(0, slashIdx);
    const file = path.substring(slashIdx + 1);
    return `https://archive.org/download/${id}/${encodeURIComponent(file)}`;
}

/**
 * Resolve an ia:// URL to the item page on archive.org.
 */
export function resolveIAItemUrl(iaUrl: string): string {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return '';
    const id = iaUrl.replace('ia://', '').split('/')[0];
    return `https://archive.org/details/${id}`;
}
