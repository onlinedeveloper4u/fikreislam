import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Music } from 'lucide-react';
import BentoGrid from './BentoGrid';
import type { ContentItem, ContentType } from '../lib/types';

interface ContentSectionProps {
    items: ContentItem[];
    contentType: ContentType;
    title: string;
    description: string;
}

const LANGUAGES = ['تمام', 'انگریزی', 'عربی', 'اردو', 'ترکی'];

export default function ContentSection({ items, contentType, title, description }: ContentSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('تمام');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const TypeIcon = Music;

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        items.forEach((item) => item.tags?.forEach((tag) => tags.add(tag)));
        return Array.from(tags).sort();
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                !searchQuery ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesLang = selectedLanguage === 'تمام' || item.language === selectedLanguage;
            const matchesTag = !selectedTag || item.tags?.includes(selectedTag);

            return matchesSearch && matchesLang && matchesTag;
        });
    }, [items, searchQuery, selectedLanguage, selectedTag]);

    const hasActiveFilters = searchQuery || selectedLanguage !== 'تمام' || selectedTag;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLanguage('تمام');
        setSelectedTag(null);
    };

    return (
        <div className="space-y-10 pb-24 pt-28">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center relative py-6"
            >
                <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 animate-pulse-glow"
                >
                    <TypeIcon className="w-10 h-10 text-slate-900" />
                </motion.div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
                    {title}
                </h1>
                <p className="text-slate-900/35 text-lg max-w-2xl mx-auto leading-relaxed">
                    {description}
                </p>
            </motion.div>

            {/* Search & Filter Bar */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                className="glass-card p-4 sm:p-6 flex flex-col lg:flex-row gap-4"
            >
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-900/20 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="عنوان، مصنف، یا تفصیل کے ذریعے تلاش کریں..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-900/5 border border-slate-900/5 text-slate-900 placeholder:text-slate-900/20 focus:outline-none focus:border-emerald-200/50 focus:bg-slate-900/8 transition-all text-sm"
                    />
                </div>

                {/* Language Filter */}
                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                    <div className="relative">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="h-12 pl-10 pr-6 rounded-xl bg-slate-900/5 border border-slate-900/5 text-slate-900/70 focus:outline-none focus:border-emerald-200/50 appearance-none cursor-pointer text-sm min-w-[140px]"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang} className="bg-slate-100 text-slate-900">
                                    {lang}
                                </option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/20 pointer-events-none" />
                    </div>

                    {/* Tag Filter */}
                    {allTags.length > 0 && (
                        <select
                            value={selectedTag || '_all'}
                            onChange={(e) => setSelectedTag(e.target.value === '_all' ? null : e.target.value)}
                            className="h-12 px-4 rounded-xl bg-slate-900/5 border border-slate-900/5 text-slate-900/70 focus:outline-none focus:border-emerald-200/50 appearance-none cursor-pointer text-sm min-w-[140px]"
                        >
                            <option value="_all" className="bg-slate-100 text-slate-900">تمام نشانیاں</option>
                            {allTags.map((tag) => (
                                <option key={tag} value={tag} className="bg-slate-100 text-slate-900">{tag}</option>
                            ))}
                        </select>
                    )}

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="h-12 w-12 rounded-xl bg-slate-900/5 border border-slate-900/5 text-slate-900/30 hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-all flex items-center justify-center flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-2 text-slate-900/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-glow" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">
                        {filtered.length} نتائج
                    </span>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-[11px] font-bold text-emerald-600/60 hover:text-emerald-600 uppercase tracking-widest transition-colors"
                    >
                        فلٹرز صاف کریں
                    </button>
                )}
            </div>

            {/* Bento Grid */}
            <BentoGrid items={filtered} />
        </div>
    );
}
