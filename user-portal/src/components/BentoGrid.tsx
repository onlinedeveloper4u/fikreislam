import { motion } from 'framer-motion';
import BentoCard from './BentoCard';
import type { ContentItem } from '../lib/types';

interface BentoGridProps {
    items: ContentItem[];
    title?: string;
    description?: string;
    emptyMessage?: string;
    viewMode?: 'grid' | 'list';
}

export default function BentoGrid({
    items,
    title,
    description,
    emptyMessage,
    viewMode = 'grid'
}: BentoGridProps) {
    if (items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 glass-card"
            >
                <div className="w-20 h-20 rounded-full bg-slate-900/5 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎵</span>
                </div>
                <p className="font-urdu text-slate-900/40 text-lg font-medium">
                    {emptyMessage || 'ابھی تک کوئی مواد نہیں ملا'}
                </p>
            </motion.div>
        );
    }

    return (
        <section className="space-y-8">
            {(title || description) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                >
                    {title && (
                        <h2 className="font-urdu text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="text-slate-900/40 text-lg max-w-2xl mx-auto leading-relaxed">
                            {description}
                        </p>
                    )}
                </motion.div>
            )}

            <div className={viewMode === 'list' ? 'flex flex-col gap-4' : 'bento-grid'}>
                {items.map((item, index) => (
                    <BentoCard
                        key={item.id}
                        item={item}
                        index={index}
                        viewMode={viewMode}
                    />
                ))}
            </div>
        </section>
    );
}
