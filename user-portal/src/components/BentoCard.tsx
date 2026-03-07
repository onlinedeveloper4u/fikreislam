import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, User, Calendar, Download, Clock, Loader2 } from 'lucide-react';
import { audioStore } from '../lib/audioStore';
import { resolveMediaUrl } from '../lib/media';
import type { ContentItem } from '../lib/types';
import { useAudioStore } from '../hooks/useAudioStore';

interface BentoCardProps {
    item: ContentItem;
    index: number;
    viewMode?: 'grid' | 'list';
}

const getFileSizeParts = (size: string | number | null) => {
    if (!size) return null;
    const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
    if (isNaN(bytes)) return { value: size.toString(), unit: '' };

    if (bytes < 1024 * 1024) {
        return { value: (bytes / 1024).toFixed(1), unit: 'کے بی' };
    } else if (bytes < 1024 * 1024 * 1024) {
        return { value: (bytes / (1024 * 1024)).toFixed(1), unit: 'ایم بی' };
    } else {
        return { value: (bytes / (1024 * 1024 * 1024)).toFixed(1), unit: 'جی بی' };
    }
};

const Waveform = () => (
    <div className="flex items-center gap-0.5 h-4">
        <div className="waveform-line h-2" style={{ animationDelay: '0s' }} />
        <div className="waveform-line h-4" style={{ animationDelay: '0.2s' }} />
        <div className="waveform-line h-3" style={{ animationDelay: '0.4s' }} />
        <div className="waveform-line h-2" style={{ animationDelay: '0.1s' }} />
    </div>
);

export default function BentoCard({ item, index, viewMode = 'grid' }: BentoCardProps) {
    const sizeParts = getFileSizeParts(item.file_size);
    const globalAudio = useAudioStore();
    const isCurrentTrack = globalAudio.track?.id === item.id;
    const isPlaying = isCurrentTrack && globalAudio.isPlaying;

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isCurrentTrack) {
            audioStore.toggle();
            return;
        }

        const url = resolveMediaUrl(item.file_url);
        if (!url) return;

        audioStore.play({
            id: item.id,
            title: item.title,
            author: item.author ?? undefined,
            url,
        });
    };

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDownloading) return;

        const url = resolveMediaUrl(item.file_url);
        if (!url) return;

        setIsDownloading(true);

        const token = Math.random().toString(36).substring(2, 10);
        const cookieName = `dl_${token}`;
        const fileName = `${item.title}.mp3`;
        const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}&token=${token}`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Poll for the cookie that the API sets when the download stream starts
        const maxWait = 15000; // 15s failsafe timeout
        const startTime = Date.now();
        const interval = setInterval(() => {
            const hasCookie = document.cookie.includes(cookieName);
            const timedOut = Date.now() - startTime > maxWait;

            if (hasCookie || timedOut) {
                clearInterval(interval);
                setIsDownloading(false);
                // Clean up the cookie
                if (hasCookie) {
                    document.cookie = `${cookieName}=; Path=/; Max-Age=0`;
                }
            }
        }, 200);
    }, [isDownloading, item.file_url, item.title]);

    if (viewMode === 'list') {
        return (
            <motion.a
                href={`/audio/${item.id}`}
                style={{ textDecoration: 'none' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                className="glass-card group flex items-center gap-4 p-3 sm:p-4 bg-white hover:shadow-lg transition-all border border-slate-900/5 relative"
            >
                {/* List View Playing Indicator */}
                {isPlaying && (
                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 rounded-r-full" />
                )}

                {/* Compact Thumbnail for List */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 relative shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    {item.cover_image_url ? (
                        <img
                            src={item.cover_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-100">
                            <Music className="w-8 h-8 text-emerald-600/10" />
                        </div>
                    )}

                    {/* Centered Play Overlay for List */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/5 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button onClick={handlePlay} className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                            {isPlaying ? <Waveform /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                    </div>
                    {/* Unified Metadata Overlay Bar for List (Premium Glass) */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 px-2 py-1.5 bg-black/40 backdrop-blur border-t border-white/5 flex items-center justify-between text-white text-[9px] font-sans font-bold leading-none">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-white/60 -translate-y-px" />
                            <span>{item.duration || '--:--'}</span>
                        </div>
                        {item.published_at && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-white/60 -translate-y-px" />
                                <span>{new Date(item.published_at).getFullYear()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area for List */}
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-3 text-[10px] font-bold mb-1.5 flex-wrap">
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider shrink-0">{item.language}</span>
                    </div>

                    <h3 className={`font-urdu font-bold text-sm sm:text-base mb-1 pr-1 truncate transition-colors ${isPlaying ? 'text-emerald-700' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                        {item.title}
                    </h3>

                    {item.author && (
                        <p className="text-slate-900/50 text-xs flex items-center gap-1.5 font-medium pr-2 truncate">
                            <User className="w-3.5 h-3.5 text-emerald-600/30" />
                            {item.author}
                        </p>
                    )}
                </div>

                {/* Actions for List */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                        onClick={handlePlay}
                        className={`hidden sm:flex h-10 px-4 rounded-xl items-center gap-2 text-xs font-bold shadow-sm active:scale-95 transition-all ${isPlaying ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-600 text-white shadow-emerald-500/20'}`}
                    >
                        {isPlaying ? <Waveform /> : <Play className="w-4 h-4 fill-current" />}
                        {isPlaying ? 'جاری ہے' : 'چلائیں'}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`h-10 px-4 rounded-xl border flex items-center justify-center gap-3 active:scale-95 transition-all group/btn ${isDownloading
                                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-600 cursor-wait'
                                : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700'
                            }`}
                        aria-label="Download"
                    >
                        {isDownloading ? (
                            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        ) : (
                            <>
                                {sizeParts && (
                                    <div className="flex items-center gap-1.5 font-sans leading-none">
                                        <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-800 transition-colors">{sizeParts.value}</span>
                                        <span className="text-[9px] opacity-60 font-medium">{sizeParts.unit}</span>
                                    </div>
                                )}
                                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            </>
                        )}
                    </button>
                </div>
            </motion.a>
        );
    }

    return (
        <motion.a
            href={`/audio/${item.id}`}
            style={{ textDecoration: 'none' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card group cursor-pointer overflow-hidden flex flex-col h-full border border-slate-900/5 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
        >
            {/* Thumbnail Area with Center Play Button */}
            <div className="aspect-square relative overflow-hidden bg-slate-50">
                {item.cover_image_url ? (
                    <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-100">
                        <Music className="w-12 h-12 text-emerald-600/10" />
                    </div>
                )}

                {/* Scrim Overlay */}
                <div className={`absolute inset-0 transition-colors duration-300 ${isPlaying ? 'bg-black/20' : 'bg-black/10 group-hover:bg-black/20'}`} />

                {/* Center Play Button / Waveform */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={handlePlay}
                        className={`w-16 h-16 rounded-full flex items-center justify-center active:scale-90 transition-all border-4 border-white/30 backdrop-blur-sm z-10
                            ${isPlaying
                                ? 'bg-emerald-600/40 text-white shadow-xl hover:bg-emerald-600/60'
                                : 'bg-emerald-600 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-emerald-500 hover:scale-105'
                            }`}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Waveform /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>
                </div>

                {/* Language Badge (Top Right) */}
                {item.language && (
                    <div className="absolute top-2 right-2 z-20">
                        <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-[10px] shadow-lg border border-white/20 shrink-0">
                            {item.language}
                        </span>
                    </div>
                )}

                {/* Unified Metadata Overlay Bar (Premium Glass Edition) */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-2 bg-black/45 backdrop-blur border-t border-white/10 flex items-center justify-between text-white text-[10px] font-sans font-bold leading-none">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-white/60 -translate-y-px" />
                        <span>{item.duration || '--:--'}</span>
                    </div>
                    {item.published_at && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-white/60 -translate-y-px" />
                            <span>{new Date(item.published_at).getFullYear()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="pt-4 flex-1 flex flex-col">
                <div className="px-4 flex-1 flex flex-col">
                    {/* Title & Author */}
                    <div className="space-y-1 mb-5">
                        <h3 className={`font-urdu font-bold text-sm transition-colors ${isPlaying ? 'text-emerald-700' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                            {item.title}
                        </h3>
                        {item.author && (
                            <div className="text-slate-900/50 text-[11px] flex items-center gap-1 font-medium truncate">
                                <User className="w-3 h-3 text-emerald-600/30" />
                                <span>{item.author}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ultra-Soft Outlined Download Button */}
                <div className="px-4 pb-5 mt-auto">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`w-full h-11 rounded-2xl border flex items-center justify-center gap-4 active:scale-95 transition-all group/btn ${isDownloading
                                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-600 cursor-wait'
                                : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700'
                            }`}
                        aria-label="Download"
                    >
                        {isDownloading ? (
                            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        ) : (
                            <>
                                {sizeParts && (
                                    <div className="flex items-center gap-2 font-sans leading-none">
                                        <span className="text-sm font-extrabold tracking-tight text-slate-800 group-hover/btn:text-emerald-700 transition-colors">{sizeParts.value}</span>
                                        <span className="text-[10px] opacity-60 font-medium group-hover/btn:text-emerald-600 transition-colors">{sizeParts.unit}</span>
                                    </div>
                                )}
                                <Download className="w-5 h-5 text-slate-400 group-hover/btn:text-emerald-600 group-hover/btn:scale-110 transition-all" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.a>
    );
}
