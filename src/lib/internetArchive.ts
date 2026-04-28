import 'server-only';
import { extractIAIdentifier } from './ia-utils';

/**
 * Internet Archive integration — Python Backend Proxy
 * 
 * All IA operations are now handled by the Python backend service
 * which uses the official `internetarchive` Python library.
 * 
 * This file proxies requests from Next.js server actions / API routes
 * to the Python FastAPI backend.
 */

const IA_BACKEND_URL = process.env.IA_BACKEND_URL || 'http://localhost:8000';
const IA_BACKEND_API_KEY = process.env.IA_BACKEND_API_KEY || '';

/**
 * Common headers for all backend requests.
 */
function getBackendHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${IA_BACKEND_API_KEY}`,
    };
    if (contentType) headers['Content-Type'] = contentType;
    return headers;
}

/**
 * Make a request to the Python IA backend with error handling.
 */
async function backendFetch(
    path: string,
    options: RequestInit
): Promise<Response> {
    const url = `${IA_BACKEND_URL}/api/ia${path}`;
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                ...getBackendHeaders(),
                ...options.headers,
            },
        });
        return res;
    } catch (error: any) {
        console.error(`IA Backend request failed at ${url}:`, error.message);
        throw new Error(`IA Backend unreachable: ${error.message}`);
    }
}

export interface IAUploadResult {
    identifier: string;
    fileName: string;
    iaUrl: string;
    downloadUrl: string;
    coverIaUrl?: string | null;
}

export { extractIAIdentifier };

/**
 * Update metadata via Python backend.
 */
export async function updateInternetArchiveMetadata(
    iaUrl: string,
    metadata: {
        speaker?: string;
        media_type?: string;
        title?: string;
        contentType?: 'آڈیو' | 'ویڈیو' | 'book';
    }
): Promise<boolean> {
    try {
        const response = await backendFetch('/metadata', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ia_url: iaUrl,
                title: metadata.title,
                speaker: metadata.speaker,
                media_type: metadata.media_type,
                contentType: metadata.contentType,
            }),
        });

        if (!response.ok) {
            const err = await response.text().catch(() => '');
            console.error('IA metadata update failed:', response.status, err);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating IA metadata:', error);
        return false;
    }
}

/**
 * Upload a file to IA via the Python backend.
 * 
 * The Python backend saves the file to disk and uses the official
 * `internetarchive` library's upload() function which handles
 * retries, auth, and bucket creation automatically.
 */
export async function uploadToInternetArchive(
    file: File,
    metadata: {
        speaker?: string;
        media_type?: string;
        title?: string;
        contentType?: 'آڈیو' | 'ویڈیو' | 'book';
    },
    coverFile?: File | null,
    signal?: AbortSignal,
    existingIdentifier?: string
): Promise<IAUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (coverFile && coverFile.size > 0) formData.append('coverFile', coverFile);
    formData.append('metadata', JSON.stringify(metadata));
    if (existingIdentifier) formData.append('existingIdentifier', existingIdentifier);

    const response = await backendFetch('/upload', {
        method: 'POST',
        body: formData,
        signal,
        // Don't set Content-Type — let browser set multipart boundary
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errJson = await response.json();
            errorMsg = errJson.error || errJson.detail || JSON.stringify(errJson);
        } catch (e) {
            const text = await response.text().catch(() => '');
            if (text) errorMsg = text;
        }
        throw new Error(`IA Backend Error (${response.status}): ${errorMsg}`);
    }

    return await response.json();
}

/**
 * Rename a file in an IA item via the Python backend.
 */
export async function renameInternetArchiveFile(
    iaUrl: string,
    newTitle: string
): Promise<{ iaUrl: string; downloadUrl: string } | null> {
    try {
        const response = await backendFetch('/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ia_url: iaUrl, new_title: newTitle }),
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error renaming IA file:', error);
        return null;
    }
}

/**
 * Trigger IA derive via the Python backend.
 */
export async function triggerIADerive(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    try {
        const response = await backendFetch('/derive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier }),
        });
        return response.ok;
    } catch (error) {
        console.error('Error triggering IA derive:', error);
        return false;
    }
}

/**
 * Delete a single file from an IA item via the Python backend.
 */
export async function deleteIAFile(iaUrl: string): Promise<boolean> {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return false;
    try {
        const response = await backendFetch('/file', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ia_url: iaUrl }),
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting IA file:', error);
        return false;
    }
}

/**
 * Delete all files in an IA item via the Python backend.
 */
export async function deleteIAItem(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    try {
        const response = await backendFetch('/item', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier }),
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting IA item:', error);
        return false;
    }
}
