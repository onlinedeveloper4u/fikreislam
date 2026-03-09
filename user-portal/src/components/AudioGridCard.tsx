import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, User, Calendar, Download, Clock, Loader2 } from 'lucide-react';
import { audioStore } from '../lib/audioStore';
import { resolveMediaUrl } from '../lib/media';
import type { ContentItem } from '../lib/types';
import { useAudioStore } from '../hooks/useAudioStore';
import { getFileSizeParts, Waveform } from './AudioCardUtilities';

interface AudioGridCardProps {
    item: ContentItem;
    index: number;
}


export default function AudioGridCard({ item, index }: AudioGridCardProps) {
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

        const maxWait = 15000;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const hasCookie = document.cookie.includes(cookieName);
            const timedOut = Date.now() - startTime > maxWait;

            if (hasCookie || timedOut) {
                clearInterval(interval);
                setIsDownloading(false);
                if (hasCookie) {
                    document.cookie = `${cookieName}=; Path=/; Max-Age=0`;
                }
            }
        }, 200);
    }, [isDownloading, item.file_url, item.title]);

    return (
        <motion.div
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
            className="glass-card group overflow-hidden flex flex-col h-full border border-slate-900/5 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
        >
            {/* Thumbnail Area */}
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

                {/* Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={handlePlay}
                        className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center active:scale-90 transition-all border-2 sm:border-4 border-white/30 backdrop-blur-sm z-10
                            ${isPlaying
                                ? 'bg-emerald-600/40 text-white shadow-xl hover:bg-emerald-600/60'
                                : 'bg-emerald-600 text-white shadow-[0_8px_32_rgba(0,0,0,0.4)] hover:bg-emerald-500 hover:scale-105'
                            }`}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Waveform /> : <Play className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-current ml-0.5 sm:ml-1" />}
                    </button>
                </div>

                {/* Language Badge */}
                {item.language && (
                    <div className="absolute top-2 right-2 z-20">
                        <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-[10px] shadow-lg border border-white/20 shrink-0">
                            {item.language}
                        </span>
                    </div>
                )}

                {/* Metadata Overlay Bar */}
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

                {/* Download Button */}
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
        </motion.div>
    );
}
