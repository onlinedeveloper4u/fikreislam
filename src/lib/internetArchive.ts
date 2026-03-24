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
    iaUrl: string;       // ia://identifier/filename — stored in DB
    downloadUrl: string; // https://archive.org/download/...
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
    },
    signal?: AbortSignal
): Promise<IAUploadResult> {
    const { accessKey, secretKey } = getIACredentials();
    const identifier = generateItemIdentifier(metadata.speaker);
    const fileName = sanitizeFileName(file.name);

    // Helper: IA supports URI-encoded metadata values via uri() wrapper
    // This is needed because HTTP headers only allow ISO-8859-1 characters
    const encMeta = (value: string): string => {
        // Check if value contains non-ASCII characters
        if (/[^\x00-\x7F]/.test(value)) {
            return `uri(${encodeURIComponent(value)})`;
        }
        return value;
    };

    const title = metadata.title || fileName;
    const description = `Audio content from Fikr-e-Islam${metadata.speaker ? ` by ${metadata.speaker}` : ''}`;

    const headers: Record<string, string> = {
        'Authorization': `LOW ${accessKey}:${secretKey}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-amz-auto-make-bucket': '1',
        // IA metadata headers — URI-encode non-ASCII values
        'x-archive-meta-mediatype': 'audio',
        'x-archive-meta-collection': 'opensource_audio',
        'x-archive-meta-title': encMeta(title),
        'x-archive-meta-description': encMeta(description),
    };

    if (metadata.speaker) {
        headers['x-archive-meta-creator'] = encMeta(metadata.speaker);
    }
    if (metadata.audioType) {
        headers['x-archive-meta-subject'] = encMeta(metadata.audioType);
    }

    const uploadUrl = `${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`;

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
        signal,
    });

    if (!response.ok) {
        let errorDetail = '';
        try {
            errorDetail = await response.text();
        } catch { /* ignore */ }
        throw new Error(`Internet Archive upload failed (${response.status}): ${errorDetail || response.statusText}`);
    }

    const iaUrl = `ia://${identifier}/${fileName}`;
    const downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(fileName)}`;

    return { identifier, fileName, iaUrl, downloadUrl };
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
