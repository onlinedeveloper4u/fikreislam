/**
 * Internet Archive S3-like API integration
 * Docs: https://archive.org/developers/ias3.html
 *
 * URL convention: ia://<identifier>/<filename>
 * Resolves to:   https://archive.org/download/<identifier>/<filename>
 */

const IA_S3_ENDPOINT = 'https://s3.us.archive.org';

function getIACredentials(): { accessKey: string; secretKey: string } {
    const accessKey = process.env.NEXT_PUBLIC_IA_ACCESS_KEY;
    const secretKey = process.env.NEXT_PUBLIC_IA_SECRET_KEY;
    if (!accessKey || !secretKey) {
        throw new Error('Internet Archive credentials not configured. Set NEXT_PUBLIC_IA_ACCESS_KEY and NEXT_PUBLIC_IA_SECRET_KEY in .env');
    }
    return { accessKey, secretKey };
}

/**
 * Generate a unique Internet Archive item identifier.
 * IA identifiers must be alphanumeric + hyphens/underscores, 5-100 chars.
 */
function generateItemIdentifier(speakerSlug?: string): string {
    const shortId = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
    // Sanitize speaker name to ASCII-safe slug (Urdu/Arabic → removed, spaces → hyphens)
    if (speakerSlug) {
        const slug = speakerSlug
            .replace(/[^\w\s-]/g, '') // remove non-word chars (keeps ASCII letters, digits, underscore)
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase()
            .substring(0, 40);
        if (slug.length >= 3) {
            return `fikreislam-${slug}-${shortId}`;
        }
    }
    return `fikreislam-audio-${shortId}`;
}

/**
 * Sanitize a filename for safe use in Internet Archive URLs.
 * Replaces spaces with underscores and removes problematic characters.
 */
function sanitizeFileName(name: string): string {
    return name
        .replace(/\s+/g, '_')
        .replace(/[^\w.\-\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '_') // keep Arabic/Urdu chars
        .replace(/_+/g, '_');
}

export interface IAUploadResult {
    identifier: string;
    fileName: string;
    iaUrl: string;           // ia://identifier/filename — stored in DB
    downloadUrl: string;     // https://archive.org/download/...
    coverIaUrl?: string | null;  // ia://identifier/cover_filename
}

/**
 * Extract the Internet Archive identifier from a URL (supports ia:// and web URLs)
 */
export function extractIAIdentifier(url: string | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('ia://')) {
        return url.replace('ia://', '').split('/')[0];
    }
    // Handle https://archive.org/download/identifier/filename
    if (url.includes('archive.org/download/')) {
        const parts = url.split('archive.org/download/')[1].split('/');
        return parts[0];
    }
    // Handle https://archive.org/details/identifier
    if (url.includes('archive.org/details/')) {
        const parts = url.split('archive.org/details/')[1].split('/');
        return parts[0];
    }
    return undefined;
}

/**
 * Update metadata of an existing Internet Archive item.
 */
export async function updateInternetArchiveMetadata(
    iaUrl: string,
    metadata: {
        speaker?: string;
        audioType?: string;
        title?: string;
        contentType?: 'audio' | 'video' | 'book';
    }
): Promise<boolean> {
    const identifier = extractIAIdentifier(iaUrl);
    if (!identifier) return false;

    const { accessKey, secretKey } = getIACredentials();

    // Helper: Format metadata for Metadata API (JSON Patch style)
    const mediaType = metadata.contentType === 'video' ? 'movies' : 
                      (metadata.contentType === 'book' ? 'texts' : 'audio');

    // Build patches
    const patches: any[] = [
        { op: 'add', path: '/mediatype', value: mediaType },
    ];

    if (metadata.title) {
        patches.push({ op: 'add', path: '/title', value: metadata.title });
        patches.push({ op: 'add', path: '/description', value: `Content from Fikr-e-Islam: ${metadata.title}` });
    }
    if (metadata.speaker) {
        patches.push({ op: 'add', path: '/creator', value: metadata.speaker });
    }
    if (metadata.audioType) {
        patches.push({ op: 'add', path: '/subject', value: metadata.audioType });
    }

    try {
        // Use IA Metadata API instead of S3 for updates
        // Docs: https://archive.org/services/docs/api/metadata.html
        const response = await fetch(`https://archive.org/metadata/${identifier}`, {
            method: 'POST',
            headers: {
                'Authorization': `LOW ${accessKey}:${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                '-target': 'metadata',
                '-patch': JSON.stringify(patches),
            }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            // "no changes to _meta.xml" is not an actual error, it just means the metadata is already correct.
            const errorStr = JSON.stringify(result.error || result);
            if (response.status === 400 && errorStr.includes('no changes to _meta.xml')) {
                return true;
            }
            console.error('IA metadata update failed:', response.status, result.error || result);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating IA metadata:', error);
        return false;
    }
}

/**
 * Upload a file to Internet Archive using their S3-like API
 */
export async function uploadToInternetArchive(
    file: File,
    metadata: {
        speaker?: string;
        audioType?: string;
        title?: string;
        contentType?: 'audio' | 'video' | 'book';
    },
    coverFile?: File | null,
    signal?: AbortSignal,
    existingIdentifier?: string // Optional identifier to upload to an existing item
): Promise<IAUploadResult> {
    const { accessKey, secretKey } = getIACredentials();
    const identifier = existingIdentifier || generateItemIdentifier(metadata.speaker);
    const fileName = file.size > 0 ? sanitizeFileName(file.name) : null;

    // Helper: IA supports URI-encoded metadata values via uri() wrapper
    const encMeta = (value: string): string => {
        if (/[^\x00-\x7F]/.test(value)) {
            return `uri(${encodeURIComponent(value)})`;
        }
        return value;
    };

    const title = metadata.title || (fileName || identifier);
    const mediaType = metadata.contentType === 'video' ? 'movies' : 
                      (metadata.contentType === 'book' ? 'texts' : 'audio');
    
    const collection = 'opensource';

    const headers: Record<string, string> = {
        'Authorization': `LOW ${accessKey}:${secretKey}`,
        'x-amz-auto-make-bucket': '1',
        'x-archive-meta-mediatype': mediaType,
        'x-archive-meta-collection': collection,
        'x-archive-meta-title': encMeta(title),
        'x-archive-meta-description': encMeta(`Content from Fikr-e-Islam: ${title}`),
    };

    if (metadata.speaker) {
        headers['x-archive-meta-creator'] = encMeta(metadata.speaker);
    }
    if (metadata.audioType) {
        headers['x-archive-meta-subject'] = encMeta(metadata.audioType);
    }

    // 1. Upload main file if provided
    let iaUrl = '';
    let downloadUrl = '';

    if (fileName && file.size > 0) {
        const uploadUrl = `${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`;
        headers['Content-Type'] = file.type || 'application/octet-stream';

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers,
            body: file,
            signal,
        });

        if (!response.ok) {
            let errorDetail = '';
            try { errorDetail = await response.text(); } catch { /* ignore */ }
            throw new Error(`Internet Archive upload failed (${response.status}): ${errorDetail || response.statusText}`);
        }
        iaUrl = `ia://${identifier}/${fileName}`;
        downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(fileName)}`;
    }

    // 2. Upload cover if provided (to the SAME identifier)
    let coverIaUrl = null;
    if (coverFile) {
        // Use a consistent name for cover image to ensure overwriting and proper thumbnail generation
        const coverExt = coverFile.name.split('.').pop() || 'jpg';
        const coverFileName = `cover.${coverExt}`;
        const coverUploadUrl = `${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(coverFileName)}`;
        
        const coverHeaders = {
            'Authorization': `LOW ${accessKey}:${secretKey}`,
            'Content-Type': coverFile.type || 'image/jpeg',
            'x-amz-auto-make-bucket': '1',
        };

        const coverResponse = await fetch(coverUploadUrl, {
            method: 'PUT',
            headers: coverHeaders,
            body: coverFile,
            signal,
        });

        if (coverResponse.ok) {
            coverIaUrl = `ia://${identifier}/${coverFileName}`;
        } else {
            console.warn('Cover upload to Internet Archive failed (non-blocking):', coverResponse.status);
        }
    }

    return { identifier, fileName: fileName || '', iaUrl, downloadUrl, coverIaUrl };
}

/**
 * Rename a file within an Internet Archive item.
 */
export async function renameInternetArchiveFile(
    iaUrl: string,
    newTitle: string
): Promise<{ iaUrl: string; downloadUrl: string } | null> {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return null;

    const path = iaUrl.replace('ia://', '');
    const parts = path.split('/');
    if (parts.length < 2) return null;

    const identifier = parts[0];
    const oldFileName = parts[1];
    
    const ext = oldFileName.split('.').pop() || '';
    const newFileName = `${sanitizeFileName(newTitle)}.${ext}`;

    if (oldFileName === newFileName) return { 
        iaUrl: `ia://${identifier}/${oldFileName}`,
        downloadUrl: `https://archive.org/download/${identifier}/${encodeURIComponent(oldFileName)}`
    };

    try {
        const { accessKey, secretKey } = getIACredentials();

        // 1. Copy file to a new name
        // IA S3 API supports X-Amz-Copy-Source - Must be encoded for headers
        const encodedOldFileName = oldFileName.split('/').map(p => encodeURIComponent(p)).join('/');
        const response = await fetch(`${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(newFileName)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `LOW ${accessKey}:${secretKey}`,
                'X-Amz-Copy-Source': `/${identifier}/${encodedOldFileName}`,
                'x-archive-auto-make-bucket': '1',
            }
        });

        if (!response.ok) {
            console.error('IA rename (copy) failed:', response.status, await response.text().catch(() => ''));
            return null;
        }

        // 2. Delete the old file
        await deleteFromInternetArchive(iaUrl);

        return {
            iaUrl: `ia://${identifier}/${newFileName}`,
            downloadUrl: `https://archive.org/download/${identifier}/${encodeURIComponent(newFileName)}`
        };
    } catch (error) {
        console.error('Error renaming IA file:', error);
        return null;
    }
}

/**
 * Trigger a "derive" task on Internet Archive.
 * This forces IA to regenerate thumbnails and technical metadata.
 */
export async function triggerIADerive(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    try {
        const { accessKey, secretKey } = getIACredentials();
        const response = await fetch(`https://archive.org/metadata/${identifier}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `LOW ${accessKey}:${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                '-target': 'derive',
                '-force': '1',
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error triggering IA derive:', error);
        return false;
    }
}

/**
 * Delete a file from Internet Archive.
 * Note: IA doesn't truly delete immediately; it marks for removal.
 */
export async function deleteFromInternetArchive(iaUrl: string): Promise<boolean> {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return false;

    const path = iaUrl.replace('ia://', '');
    const slashIndex = path.indexOf('/');
    if (slashIndex === -1) return false;

    const identifier = path.substring(0, slashIndex);
    const fileName = path.substring(slashIndex + 1);

    if (!identifier || !fileName) return false;

    try {
        const { accessKey, secretKey } = getIACredentials();

        const response = await fetch(
            `${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `LOW ${accessKey}:${secretKey}`,
                    'x-archive-cascade-delete': '1',
                },
            }
        );

        if (!response.ok) {
            console.error('IA delete failed:', response.status, await response.text().catch(() => ''));
        }

        return response.ok;
    } catch (error) {
        console.error('Error deleting from Internet Archive:', error);
        return false;
    }
}

/**
 * Resolve an ia:// URL to a public download URL
 */
export function resolveIADownloadUrl(iaUrl: string): string {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return '';
    const path = iaUrl.replace('ia://', '');
    // The path is identifier/fileName — encode only the filename part
    const slashIndex = path.indexOf('/');
    if (slashIndex === -1) return `https://archive.org/download/${path}`;
    const identifier = path.substring(0, slashIndex);
    const fileName = path.substring(slashIndex + 1);
    return `https://archive.org/download/${identifier}/${encodeURIComponent(fileName)}`;
}

/**
 * Resolve an ia:// URL to the item's page on archive.org
 */
export function resolveIAItemUrl(iaUrl: string): string {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return '';
    const path = iaUrl.replace('ia://', '');
    const identifier = path.split('/')[0];
    return `https://archive.org/details/${identifier}`;
}
