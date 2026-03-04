import { motion } from 'framer-motion';
import { Music, Play, User, Calendar, Download } from 'lucide-react';
import { audioStore } from '../lib/audioStore';
import { resolveMediaUrl } from '../lib/media';
import type { ContentItem } from '../lib/types';

interface BentoCardProps {
    item: ContentItem;
    index: number;
}

export default function BentoCard({ item, index }: BentoCardProps) {
    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const url = resolveMediaUrl(item.file_url);
        if (!url) return;

        audioStore.play({
            id: item.id,
            title: item.title,
            author: item.author ?? undefined,
            url,
        });
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const url = resolveMediaUrl(item.file_url);
        if (!url) return;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${item.title}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to simple window.open if fetch fails (e.g. CORS)
            window.open(url, '_blank');
        }
    };

    return (
        <motion.a
            href={`/audio/${item.id}`}
            style={{ textDecoration: 'none' }}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.6,
                delay: index * 0.06,
                ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass-card group cursor-pointer overflow-hidden flex flex-col"
        >
            {/* Cover Image / Placeholder */}
            <div className="aspect-square relative overflow-hidden rounded-t-[1.5rem]">
                {item.cover_image_url ? (
                    <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-slate-100">
                        <Music className="w-12 h-12 text-emerald-600/20 group-hover:text-emerald-600/40 transition-colors duration-500" />
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-center justify-center gap-4 backdrop-blur-sm">
                    <motion.div
                        initial={false}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePlay}
                        className="w-14 h-14 rounded-full gradient-emerald-glow flex items-center justify-center shadow-2xl shadow-emerald-500/40"
                    >
                        <Play className="w-6 h-6 text-slate-50 ml-0.5" />
                    </motion.div>

                    <motion.div
                        initial={false}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleDownload}
                        className="w-14 h-14 rounded-full glass border-slate-900/10 flex items-center justify-center shadow-xl hover:bg-emerald-500/10 transition-colors"
                    >
                        <Download className="w-6 h-6 text-emerald-700" />
                    </motion.div>
                </div>

                {/* Language Badge */}
                {item.language && (
                    <span className="absolute bottom-3 left-3 glass text-[10px] font-bold text-slate-900/80 px-3 py-1 rounded-lg uppercase tracking-widest">
                        {item.language}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="text-slate-900 font-bold text-sm leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors duration-300">
                    {item.title}
                </h3>

                {item.author && (
                    <p className="text-slate-900/30 text-xs flex items-center gap-1.5 font-medium">
                        <User className="w-3 h-3 text-emerald-600/50" />
                        <span className="truncate">{item.author}</span>
                    </p>
                )}

                <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-900/5">
                    {item.tags?.slice(0, 2).map((tag, i) => (
                        <span
                            key={i}
                            className="text-[9px] font-bold text-emerald-600/60 bg-emerald-100/20 px-2 py-0.5 rounded uppercase tracking-wider"
                        >
                            {tag}
                        </span>
                    ))}
                    {item.published_at && (
                        <span className="text-[10px] text-slate-900/20 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.published_at).getFullYear()}
                        </span>
                    )}
                </div>
            </div>
        </motion.a>
    );
}
