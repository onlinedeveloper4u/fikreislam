import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
    const fileUrl = url.searchParams.get('url');
    const fileName = url.searchParams.get('name') || 'audio.mp3';
    const token = url.searchParams.get('token');

    if (!fileUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow downloading from trusted domains
    const allowed = ['archive.org', 'ia601', 'ia801', 'ia901'];
    const isAllowed = allowed.some((domain) => fileUrl.includes(domain));
    if (!isAllowed) {
        return new Response('URL not allowed', { status: 403 });
    }

    try {
        const upstream = await fetch(fileUrl);

        if (!upstream.ok) {
            return new Response('Failed to fetch file', { status: upstream.status });
        }

        const headers: Record<string, string> = {
            'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        };

        const contentLength = upstream.headers.get('Content-Length');
        if (contentLength) {
            headers['Content-Length'] = contentLength;
        }

        // Set a cookie so the client knows the download has started
        if (token) {
            headers['Set-Cookie'] = `dl_${token}=1; Path=/; Max-Age=30; SameSite=Lax`;
        }

        // Stream the response back with Content-Disposition: attachment
        // This forces the browser to download instead of play
        return new Response(upstream.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Download proxy error:', error);
        return new Response('Download failed', { status: 500 });
    }
};

