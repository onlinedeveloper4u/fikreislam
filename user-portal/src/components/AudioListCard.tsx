import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, User, Calendar, Download, Clock, Loader2 } from 'lucide-react';
import { audioStore } from '../lib/audioStore';
import { resolveMediaUrl } from '../lib/media';
import type { ContentItem } from '../lib/types';
import { useAudioStore } from '../hooks/useAudioStore';
import { getFileSizeParts, Waveform } from './AudioCardUtilities';

interface AudioListCardProps {
    item: ContentItem;
    index: number;
}


export default function AudioListCard({ item, index }: AudioListCardProps) {
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
            dir="rtl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.03 }}
            whileHover={{ backgroundColor: 'rgb(248 250 252)', y: -1 }}
            whileTap={{ scale: 0.995 }}
            className="group flex h-28 bg-white rounded-2xl border border-slate-100 overflow-hidden relative shadow-sm hover:shadow-md transition-all px-0 gap-4"
        >
            {/* Image Block: Flush to the right edge */}
            <div className="shrink-0 self-stretch">
                <div className="w-28 h-full relative overflow-hidden bg-slate-50 group/img">
                    {item.cover_image_url ? (
                        <img
                            src={item.cover_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-100">
                            <Music className="w-10 h-10 text-emerald-600/10" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Block: Automatically balances spacing between the three rows */}
            <div className="flex-grow flex flex-col justify-between min-w-0 text-right py-2.5 pl-3 pr-0">
                {/* Row 1: Title */}
                <h3 className={`font-urdu font-bold text-sm sm:text-lg mb-0 line-clamp-1 leading-tight transition-colors ${isPlaying ? 'text-emerald-800' : 'text-slate-900 group-hover:text-emerald-700'}`}>
                    {item.title}
                </h3>

                {/* Row 2: Meta Line (Centered between Title and Actions) */}
                <div className="flex items-center gap-2 text-slate-400 text-[11px] sm:text-xs font-medium opacity-70">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        <span className="font-sans tracking-wide">{item.duration || '--:--'}</span>
                    </div>
                    <span className="opacity-30">•</span>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span className="font-sans uppercase tracking-wider">
                            {item.published_at ? new Date(item.published_at).toLocaleDateString('en-GB') : ''}
                        </span>
                    </div>
                </div>

                {/* Row 3: Bottom Actions */}
                <div className="flex items-center justify-between">
                    {/* Play Action */}
                    <motion.button
                        onClick={handlePlay}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgb(5, 150, 105)' }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all shadow-md active:shadow-sm ${isPlaying
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-600/90 text-white hover:bg-emerald-600'
                            }`}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Waveform /> : <Play className="w-4.5 h-4.5 fill-current transition-transform" />}
                    </motion.button>

                    {/* Download Action */}
                    <div className="flex items-center justify-center gap-2 w-[92px] h-9 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all group/dl">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="text-slate-400 group-hover/dl:text-emerald-600 transition-colors"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                        </button>
                        {sizeParts && (
                            <div className="flex items-baseline gap-1 font-sans font-bold text-[10px] text-slate-500">
                                <span className="tracking-tight">{sizeParts.value}</span>
                                <span className="text-[8px] opacity-60 font-medium">{sizeParts.unit}</span>
                            </div>
                        )}
                    </div>

                    {/* Language Badge */}
                    {item.language ? (
                        <span className="h-9 px-1 flex items-center text-emerald-600/60 text-[11px] font-bold rounded-xl capitalize tracking-wide">
                            {item.language}
                        </span>
                    ) : (
                        <div className="w-12" />
                    )}
                </div>
            </div>

        </motion.div>
    );
}
