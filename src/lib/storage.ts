import { resolveIADownloadUrl, resolveIAItemUrl } from '@/lib/internetArchive';

/**
 * Resolves an internal URL (like ia://) to an external accessible URL.
 * If the URL is already http/https, returns as is.
 */
export function resolveExternalUrl(url: string | null): string {
  if (!url) return '';

  if (url.includes('ia://')) {
    return resolveIADownloadUrl(url);
  }

  return url;
}

/**
 * Resolves an internal URL to a detail/item page URL (for viewing on the service).
 */
export function resolveItemPageUrl(url: string | null): string {
  if (!url) return '';

  if (url.includes('ia://')) {
    return resolveIAItemUrl(url);
  }

  return url;
}
