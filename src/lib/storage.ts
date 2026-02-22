import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a signed URL for a file in the content-files bucket
 * This is required because the bucket is private for security
 * @param path - The file path in the bucket (can be full URL or just path)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  path: string | null,
  expiresIn: number = 3600,
  options?: { transform?: { width: number, height: number } }
): Promise<string | null> {
  if (!path) return null;
  if (path.includes('google-drive://')) return null;

  // Extract the path from a full public URL if necessary
  const bucketPath = extractPathFromUrl(path);
  if (!bucketPath) return null;

  try {
    const { data, error } = await supabase.storage
      .from('content-files')
      .createSignedUrl(bucketPath, expiresIn, options);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

/**
 * Extract the file path from a full Supabase storage URL
 */
function extractPathFromUrl(urlOrPath: string): string | null {
  if (!urlOrPath) return null;

  // If it's already a path (not a full URL), return as-is
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }

  try {
    // Parse the URL and extract the path after /content-files/
    const url = new URL(urlOrPath);
    const pathMatch = url.pathname.match(/\/content-files\/(.+)$/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }

    // Try alternate pattern for public URLs
    const publicMatch = url.pathname.match(/\/object\/public\/content-files\/(.+)$/);
    if (publicMatch) {
      return decodeURIComponent(publicMatch[1]);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get signed URLs for multiple files in parallel
 */
export async function getSignedUrls(
  paths: (string | null)[],
  expiresIn: number = 3600
): Promise<(string | null)[]> {
  return Promise.all(paths.map(path => getSignedUrl(path, expiresIn)));
}

/**
 * Delete a file from Google Drive via the Apps Script bridge
 */
export async function deleteFromGoogleDrive(fileUrl: string | null): Promise<boolean> {
  if (!fileUrl || !fileUrl.startsWith('google-drive://')) return false;

  const fileId = fileUrl.replace('google-drive://', '');
  if (fileId.includes('/') || fileId.includes('.')) {
    console.warn('File URL seems to be a name fallback, deletion might not work correctly if it is not a real File ID:', fileId);
  }

  try {
    const gasUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (!gasUrl) return false;

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'delete',
        fileId: fileId
      }),
    });

    const result = await response.json();
    if (result.status !== 'success') {
      console.error('Google Drive deletion failure details:', {
        fileId,
        error: result.error || result.message || 'Unknown GAS error',
        fullResponse: result
      });
    }
    return result.status === 'success';
  } catch (error) {
    console.error('Network or Parse error deleting from Google Drive:', error);
    return false;
  }
}

/**
 * Rename a file in Google Drive via the Apps Script bridge
 */
export async function renameInGoogleDrive(fileUrl: string | null, newName: string): Promise<boolean> {
  if (!fileUrl || !fileUrl.startsWith('google-drive://')) return false;

  const fileId = fileUrl.replace('google-drive://', '');

  try {
    const gasUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (!gasUrl) return false;

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'rename',
        fileId: fileId,
        newName: newName
      }),
    });

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Error renaming in Google Drive:', error);
    return false;
  }
}

/**
 * Rename a folder in Google Drive via ID
 */
export async function renameFolderByIdInGoogleDrive(folderId: string, newName: string): Promise<{ success: boolean, folderId?: string, message?: string }> {
  try {
    const gasUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (!gasUrl) return { success: false, message: 'Google Apps Script URL not configured' };

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'renameFolderById',
        folderId: folderId,
        newName: newName
      }),
    });

    const result = await response.json();
    return {
      success: result.status === 'success',
      folderId: result.folderId,
      message: result.message || result.error
    };
  } catch (error: any) {
    console.error('Error renaming folder by ID in Google Drive:', error);
    return { success: false, message: error.message || 'Network error' };
  }
}

/**
 * Rename a folder in Google Drive via the Apps Script bridge
 */
export async function renameFolderInGoogleDrive(oldPath: string, newFolderName: string): Promise<{ success: boolean, folderId?: string, message?: string }> {
  try {
    const gasUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (!gasUrl) return { success: false, message: 'Google Apps Script URL not configured' };

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'renameFolder',
        oldPath: oldPath,
        newFolderName: newFolderName
      }),
    });

    const result = await response.json();
    return {
      success: result.status === 'success',
      folderId: result.folderId,
      message: result.message || result.error
    };
  } catch (error: any) {
    console.error('Error renaming folder in Google Drive:', error);
    return { success: false, message: error.message || 'Network error' };
  }
}

/**
 * Resolves an internal URL (like google-drive://) to an external accessible URL.
 * If the URL is already http/https, returns as is.
 */
export function resolveExternalUrl(url: string | null): string {
  if (!url) return '';

  if (url.includes('google-drive://')) {
    const parts = url.split('google-drive://');
    let fileId = parts[1];
    if (fileId.includes('?')) fileId = fileId.split('?')[0];
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  return url;
}
