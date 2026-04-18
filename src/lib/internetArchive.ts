import 'server-only';
import { sanitizeFileName, extractIAIdentifier } from './ia-utils';

/**
 * Internet Archive S3-like API integration
 * Docs: https://archive.org/developers/ias3.html
 */

const IA_S3_ENDPOINT = 'https://s3.us.archive.org';

/**
 * Get credentials from server-side environment ONLY.
 */
function getIACredentials(): { accessKey: string; secretKey: string } {
    const accessKey = process.env.IA_ACCESS_KEY;
    const secretKey = process.env.IA_SECRET_KEY;
    if (!accessKey || !secretKey) {
        throw new Error('Internet Archive credentials not configured. Set IA_ACCESS_KEY and IA_SECRET_KEY in server environment.');
    }
    return { accessKey, secretKey };
}

/**
 * Resilient fetch with exponential backoff and AbortSignal support.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        // Check for abort before each attempt
        if (options.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        try {
            // IA S3 can be slow, so we use a relatively long timeout if possible
            // but fetch in Node doesn't have a direct timeout option (must use AbortSignal)
            const res = await fetch(url, options);
            
            // 503 SlowDown is common with IA S3
            if (res.status === 503) {
                const waitMs = 1000 * (i + 1);
                console.warn(`IA: 503 SlowDown at ${url}. Retrying in ${waitMs}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }

            // Other errors (4xx, 5xx) should be handled by the caller, 
            // but we at least got a response.
            return res;
        } catch (e: any) {
            if (e?.name === 'AbortError') throw e;
            lastError = e;
            const waitMs = 1000 * (i + 1);
            console.warn(`IA: Fetch error at ${url}: ${e.message}. Retrying in ${waitMs}ms... (Attempt ${i + 1}/${retries})`);
            
            // If the body is a stream and it's already used, we can't retry effectively
            // unless the fetch body is a Blob/File/Buffer that can be re-read.
            // Node fetch usually handles Blob/File retries if they haven't been "locked".
            await new Promise(r => setTimeout(r, waitMs));
        }
    }
    const finalError = lastError || new Error(`Internet Archive repeatedly failed at ${url}`);
    console.error(`IA: All retries failed for ${url}. Final error: ${finalError.message}`);
    throw finalError;
}

/**
 * Generate a unique Internet Archive item identifier.
 */
function generateItemIdentifier(speakerSlug?: string): string {
    const shortId = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
    if (speakerSlug) {
        const slug = speakerSlug
            .replace(/[^\w\s-]/g, '')
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

export interface IAUploadResult {
    identifier: string;
    fileName: string;
    iaUrl: string;
    downloadUrl: string;
    coverIaUrl?: string | null;
}

/**
 * Re-exporting these from utils for better dependency management
 */
export { extractIAIdentifier };

/**
 * Update metadata using official IA Metadata API (JSON Patch).
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
    const mediaType = metadata.contentType === 'video' ? 'movies' : 
                      (metadata.contentType === 'book' ? 'texts' : 'audio');

    const patches: any[] = [{ op: 'add', path: '/mediatype', value: mediaType }];

    if (metadata.title) {
        patches.push({ op: 'add', path: '/title', value: metadata.title });
        patches.push({ op: 'add', path: '/description', value: `Content from Fikr-e-Islam: ${metadata.title}` });
    }
    if (metadata.speaker) patches.push({ op: 'add', path: '/creator', value: metadata.speaker });
    if (metadata.audioType) patches.push({ op: 'add', path: '/subject', value: metadata.audioType });

    try {
        const response = await fetchWithRetry(`https://archive.org/metadata/${identifier}`, {
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
        const errorStr = JSON.stringify(result.error || result);
        if (response.status === 400 && errorStr.includes('no changes to _meta.xml')) return true;

        return response.ok && !result.error;
    } catch (error) {
        console.error('Error updating IA metadata:', error);
        return false;
    }
}

/**
 * Upload a file to IA using official S3-like API.
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
    existingIdentifier?: string
): Promise<IAUploadResult> {
    const { accessKey, secretKey } = getIACredentials();
    const identifier = existingIdentifier || generateItemIdentifier(metadata.speaker);
    const fileName = file.size > 0 ? sanitizeFileName(file.name) : null;

    const encMeta = (value: string): string => {
        if (/[^\x00-\x7F]/.test(value)) return `uri(${encodeURIComponent(value)})`;
        return value;
    };

    const title = metadata.title || (fileName || identifier);
    const mediaType = metadata.contentType === 'video' ? 'movies' : 
                      (metadata.contentType === 'book' ? 'texts' : 'audio');
    
    const headers: Record<string, string> = {
        'Authorization': `LOW ${accessKey}:${secretKey}`,
        'x-amz-auto-make-bucket': '1',
        'x-archive-meta-mediatype': mediaType,
        'x-archive-meta-collection': 'opensource',
        'x-archive-meta-title': encMeta(title),
        'x-archive-meta-description': encMeta(`Content from Fikr-e-Islam: ${title}`),
        'x-archive-keep-old-version': '0',
    };

    if (metadata.speaker) headers['x-archive-meta-creator'] = encMeta(metadata.speaker);
    if (metadata.audioType) headers['x-archive-meta-subject'] = encMeta(metadata.audioType);

    let iaUrl = '';
    let downloadUrl = '';

    if (fileName && file.size > 0) {
        const response = await fetchWithRetry(`${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
            signal,
        });

        if (!response.ok) {
            const err = await response.text().catch(() => '');
            throw new Error(`IA upload failed (${response.status}): ${err || response.statusText}`);
        }
        iaUrl = `ia://${identifier}/${fileName}`;
        downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(fileName)}`;
    }

    let coverIaUrl = null;
    if (coverFile && coverFile.size > 0) {
        try {
            const coverFileName = `cover.${coverFile.name.split('.').pop() || 'jpg'}`;
            console.log(`IA: Uploading cover image ${coverFileName} to ${identifier}...`);
            const coverRes = await fetchWithRetry(`${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(coverFileName)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `LOW ${accessKey}:${secretKey}`,
                    'Content-Type': coverFile.type || 'image/jpeg',
                    'x-amz-auto-make-bucket': '1',
                    'x-archive-keep-old-version': '0',
                },
                body: coverFile,
                signal,
            });
            if (coverRes.ok) {
                // Consume body to free up connection
                await coverRes.text().catch(() => '');
                coverIaUrl = `ia://${identifier}/${coverFileName}`;
                console.log(`IA: Cover upload successful: ${coverIaUrl}`);
            } else {
                const errText = await coverRes.text().catch(() => '');
                console.warn(`IA: Cover upload failed with status ${coverRes.status}. Continuing without cover. Error: ${errText}`);
            }
        } catch (coverErr: any) {
            console.error('IA cover upload non-fatal error:', coverErr);
            // We don't throw here because the main file succeeded
        }
    }

    return { identifier, fileName: fileName || '', iaUrl, downloadUrl, coverIaUrl };
}

/**
 * Rename a file within an item using the Copy-Source + Delete pattern.
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
        const encodedOldPath = `/${identifier}/${oldFileName.split('/').map(p => encodeURIComponent(p)).join('/')}`;
        
        const response = await fetchWithRetry(`${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(newFileName)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `LOW ${accessKey}:${secretKey}`,
                'X-Amz-Copy-Source': encodedOldPath,
                'x-archive-auto-make-bucket': '1',
                'x-archive-keep-old-version': '0',
            }
        });

        if (!response.ok) return null;

        // Cleanup: remove old file. Partial failure doesn't invalidate the rename.
        const deleted = await deleteIAFile(iaUrl);
        if (!deleted) {
            console.warn(`IA rename: copy succeeded but old file not deleted: ${iaUrl}`);
        }

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
 * Trigger a "derive" task on Internet Archive for thumbnail/metadata refresh.
 */
export async function triggerIADerive(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    try {
        const { accessKey, secretKey } = getIACredentials();
        const response = await fetch(`https://archive.org/services/tasks.php`, {
            method: 'POST',
            headers: {
                'Authorization': `LOW ${accessKey}:${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ 
                identifier, 
                cmd: 'derive.php', 
                comment: 'force derive via cms' 
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error triggering IA derive:', error);
        return false;
    }
}

/**
 * Delete a specific file using official S3 DELETE.
 */
export async function deleteIAFile(iaUrl: string): Promise<boolean> {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return false;
    const path = iaUrl.replace('ia://', '');
    const slashIdx = path.indexOf('/');
    if (slashIdx === -1) return false;

    const identifier = path.substring(0, slashIdx);
    const fileName = path.substring(slashIdx + 1);

    try {
        const { accessKey, secretKey } = getIACredentials();
        const response = await fetch(`${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(fileName)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `LOW ${accessKey}:${secretKey}`,
                'x-archive-cascade-delete': '1',
                'x-archive-keep-old-version': '0',
            },
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting IA file:', error);
        return false;
    }
}

/**
 * Delete an entire item. IA S3 does not support bucket DELETE, so we must delete all files.
 */
export async function deleteIAItem(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    try {
        const { accessKey, secretKey } = getIACredentials();
        console.log(`IA: Deleting all files in item ${identifier}`);

        // 1. Fetch file list from IA Metadata API
        const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
        const meta = await metaRes.json();
        const files: { name: string }[] = meta.files ?? [];

        if (files.length === 0) return true; // Already empty or gone

        // 2. Delete each file via S3
        const results = await Promise.all(
            files.map(f =>
                fetch(`${IA_S3_ENDPOINT}/${identifier}/${encodeURIComponent(f.name)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `LOW ${accessKey}:${secretKey}`,
                        'x-archive-keep-old-version': '0',
                        'x-archive-cascade-delete': '1',
                    },
                }).then(r => {
                    if (!r.ok) console.warn(`IA: Failed to delete file ${f.name} in item ${identifier}`);
                    return r.ok;
                })
            )
        );

        return results.every(Boolean);
    } catch (error) {
        console.error('Error deleting IA item:', error);
        return false;
    }
}
