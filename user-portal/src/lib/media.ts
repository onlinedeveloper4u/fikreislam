/**
 * Internet Archive URL utilities (read-only, for the public user portal).
 */

/** Resolve ia://identifier/filename → public download URL */
export function resolveIADownloadUrl(iaUrl: string): string {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return '';
    const path = iaUrl.replace('ia://', '');
    const slashIndex = path.indexOf('/');
    if (slashIndex === -1) return `https://archive.org/download/${path}`;
    const identifier = path.substring(0, slashIndex);
    const fileName = path.substring(slashIndex + 1);
    return `https://archive.org/download/${identifier}/${encodeURIComponent(fileName)}`;
}

/** Resolve ia://identifier/filename → archive.org item page */
export function resolveIAItemUrl(iaUrl: string): string {
    if (!iaUrl || !iaUrl.startsWith('ia://')) return '';
    const path = iaUrl.replace('ia://', '');
    const identifier = path.split('/')[0];
    return `https://archive.org/details/${identifier}`;
}

/**
 * Resolve any stored file_url to a playable URL.
 * Handles ia://, google-drive://, and plain URLs.
 */
export function resolveMediaUrl(url: string | null): string {
    if (!url) return '';

    if (url.includes('ia://')) {
        return resolveIADownloadUrl(url);
    }

    if (url.includes('google-drive://')) {
        const parts = url.split('google-drive://');
        let fileId = parts[1];
        if (fileId.includes('?')) fileId = fileId.split('?')[0];
        fileId = fileId.replace(/['"]/g, '').trim();
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/file\/d\/(.+?)\/|\/file\/d\/(.+?)$/) || url.match(/id=(.+?)(&|$)/);
        const id = idMatch ? (idMatch[1] || idMatch[2]) : null;
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }

    return url;
}

/** Resolve to an external link for opening in new tab */
export function resolveExternalUrl(url: string | null): string {
    if (!url) return '';
    if (url.includes('ia://')) return resolveIAItemUrl(url);
    if (url.includes('google-drive://')) {
        const parts = url.split('google-drive://');
        let fileId = parts[1];
        if (fileId.includes('?')) fileId = fileId.split('?')[0];
        return `https://drive.google.com/file/d/${fileId}/view`;
    }
    return url;
}
