import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X, Music, FileText, Video as VideoIcon } from "lucide-react";

interface MediaPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url: string | null;
    type: 'book' | 'audio' | 'video';
}


/**
 * Resolves various URL types to direct links for playback/viewing
 */
const resolveMediaUrl = (url: string | null) => {
    if (!url) return '';

    // Handle internal google-drive:// scheme (even if wrapped in a signed URL)
    if (url.includes('google-drive://')) {
        // Extract the part after google-drive://
        const parts = url.split('google-drive://');
        // valid ID is usually before any query params or end of string
        let fileId = parts[1];
        if (fileId.includes('?')) {
            fileId = fileId.split('?')[0];
        }
        // If it was path based (e.g. /google-drive://...), clean it
        fileId = fileId.replace(/['"]/g, '').trim();

        return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Handle standard Google Drive links
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/file\/d\/(.+?)\/|\/file\/d\/(.+?)$/) || url.match(/id=(.+?)(&|$)/);
        const id = idMatch ? (idMatch[1] || idMatch[2]) : null;
        if (id) {
            return `https://drive.google.com/file/d/${id}/preview`;
        }
    }

    return url;
};

const resolveExternalUrl = (url: string | null) => {
    if (!url) return '';
    if (url.includes('google-drive://')) {
        const parts = url.split('google-drive://');
        let fileId = parts[1];
        if (fileId.includes('?')) fileId = fileId.split('?')[0];
        return `https://drive.google.com/file/d/${fileId}/view`;
    }
    return url;
};

export function MediaPlayer({ isOpen, onClose, title, url, type }: MediaPlayerProps) {
    const resolvedUrl = resolveMediaUrl(url);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 overflow-hidden bg-black/95 text-white border-none">
                <DialogHeader className="p-4 flex flex-row items-center justify-between border-b border-white/10 shrink-0">
                    <DialogTitle className="text-lg font-semibold truncate pr-8">{title}</DialogTitle>
                    <div className="flex items-center gap-2">
                        {url && (
                            <Button variant="ghost" size="icon" asChild>
                                <a href={resolveExternalUrl(url)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 bg-zinc-900 flex items-center justify-center relative">
                    {!resolvedUrl ? (
                        <div className="text-center p-8">
                            <p className="text-muted-foreground mb-4">
                                Unable to load this content directly.
                            </p>
                            {url && (
                                <Button variant="outline" asChild>
                                    <a href={resolveExternalUrl(url)} target="_blank" rel="noopener noreferrer">
                                        Open in New Tab
                                    </a>
                                </Button>
                            )}
                        </div>
                    ) : (url?.includes('google-drive://') || url?.includes('drive.google.com')) ? (
                        <iframe
                            src={resolvedUrl}
                            className="w-full h-full border-none"
                            title={title}
                            allow="autoplay"
                        />
                    ) : type === 'book' ? (
                        <iframe
                            src={resolvedUrl}
                            className="w-full h-full border-none"
                            title={title}
                        />
                    ) : type === 'video' ? (
                        <video
                            src={resolvedUrl}
                            controls
                            autoPlay
                            className="max-w-full max-h-full"
                        />
                    ) : type === 'audio' ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-48 h-48 bg-muted rounded-2xl flex items-center justify-center">
                                <Music className="h-20 w-20 text-muted-foreground/20" />
                            </div>
                            <audio
                                src={resolvedUrl}
                                controls
                                autoPlay
                                className="w-full max-w-md"
                            />
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

