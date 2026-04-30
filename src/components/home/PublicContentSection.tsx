'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Video, BookOpen, Search, Download, Play,
  Calendar, Loader2, Clock, User, Filter, X,
  LayoutGrid
} from 'lucide-react';
import { getApprovedMedia } from '@/actions/media';
import { getWorks } from '@/actions/books';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { resolveItemPageUrl, resolveExternalUrl } from '@/lib/storage';
import Image from 'next/image';
import { usePlayer, type ContentItem, type ContentType } from '@/contexts/PlayerContext';

type FilterType = ContentType | 'all';



export const PublicContentSection = () => {
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { play } = usePlayer();

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        const [mediaRes, booksRes] = await Promise.all([
          getApprovedMedia(100),
          getWorks()
        ]);

        let allItems: ContentItem[] = [];

        if (mediaRes.data) {
          allItems = [...allItems, ...mediaRes.data.map((m: any) => ({
            id: m.id,
            title: m.title,
            type: m.type === 'آڈیو' ? 'audio' : 'video' as ContentType,
            author: m.speaker,
            description: m.description,
            cover_image_url: m.cover_image_url,
            file_url: m.file_url,
            file_size: m.file_size,
            duration: m.duration,
            date: m.created_at,
            language: m.language,
          }))];
        }

        if (booksRes.data) {
          allItems = [...allItems, ...booksRes.data.map((w: any) => ({
            id: w.id,
            title: w.primaryTitle,
            type: 'book' as ContentType,
            author: w.authors?.map((a: any) => a.name).join(', '),
            description: w.titles?.[0] || '',
            date: w.createdAt,
          }))];
        }

        // Sort by date (most recent first)
        allItems.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        setItems(allItems);
      } else if (activeTab === 'book') {
        const { data, error } = await getWorks();
        if (data) {
          setItems(data.map((w: any) => ({
            id: w.id,
            title: w.primaryTitle,
            type: 'book',
            author: w.authors?.map((a: any) => a.name).join(', '),
            description: w.titles?.[0] || '',
            date: w.createdAt,
          })));
        }
      } else {
        const typeMap: Record<string, string> = { 'audio': 'آڈیو', 'video': 'ویڈیو' };
        const { data, error } = await getApprovedMedia();
        if (data) {
          setItems(data
            .filter((m: any) => m.type === typeMap[activeTab])
            .map((m: any) => ({
              id: m.id,
              title: m.title,
              type: activeTab as ContentType,
              author: m.speaker,
              description: m.description,
              cover_image_url: m.cover_image_url,
              file_url: m.file_url,
              file_size: m.file_size,
              duration: m.duration,
              date: m.created_at,
              language: m.language,
            })));
        }
      }
    } catch (err) {
      console.error("Error loading public content:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return { size: '0', unit: 'کے بی' };
    const kb = bytes / 1024;
    if (kb < 1024) return { size: kb.toFixed(1), unit: 'کے بی' };
    const mb = kb / 1024;
    return { size: mb.toFixed(1), unit: 'ایم بی' };
  };

  const formatDuration = (duration: string | undefined) => {
    if (!duration) return '00:00';
    return duration;
  };

  const handleDownload = (url: string | undefined, title: string) => {
    if (!url) return;
    
    const resolvedUrl = url.startsWith('ia://') ? resolveExternalUrl(url) : url;
    const ext = resolvedUrl.split('.').pop()?.split('?')[0] || 'mp3';
    const filename = `${title}.${ext}`;
    
    const proxyUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(filename)}`;
    
    // Using window.location.href with an attachment header response 
    // triggers the browser's native download manager immediately.
    window.location.href = proxyUrl;
  };

  const handlePlay = (item: ContentItem) => {
    play(item);
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-[0.03]" suppressHydrationWarning />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            {"ہماری لائبریری دریافت کریں"}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            {"مستند اسلامی کتب، آڈیو خطبات اور ویڈیوز کا تازہ ترین مجموعہ"}
          </motion.p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="flex p-1.5 bg-muted/50 rounded-2xl glass border border-border/50">
            {[
              { id: 'all', label: 'تمام', icon: LayoutGrid },
              { id: 'audio', label: 'آڈیو', icon: Music },
              { id: 'video', label: 'ویڈیو', icon: Video },
              { id: 'book', label: 'کتب', icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                suppressHydrationWarning
                onClick={() => setActiveTab(tab.id as FilterType)}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="تلاش کریں..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-background/50 border-border/40 focus:border-primary/50 transition-all rounded-xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse font-medium">{"لوڈ ہو رہا ہے..."}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-32 glass-dark rounded-[3rem] border-2 border-dashed border-border/30">
            <h3 className="text-2xl font-bold text-foreground mb-4">{"کوئی مواد نہیں ملا"}</h3>
            <p className="text-muted-foreground">{"براہ کرم تلاش کے الفاظ تبدیل کریں یا دوسری قسم منتخب کریں۔"}</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10"
          >
            {filteredItems.map((item, index) => (
              <motion.div key={item.id} variants={itemVariants}>
                <Card className="group border-none bg-card/40 glass-dark hover-lift overflow-hidden h-full flex flex-col rounded-2xl md:rounded-[2.5rem] shadow-xl md:shadow-2xl transition-all duration-700">
                  <div className="aspect-square relative bg-[#f0f4f4] overflow-hidden rounded-t-2xl md:rounded-t-[2.5rem]">
                    {item.cover_image_url ? (
                      <Image
                        src={resolveExternalUrl(item.cover_image_url)}
                        alt={item.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 4}
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#f0f4f4]">
                        {item.type === 'audio' ? <Music className="h-20 w-20 text-[#166534]/20" /> :
                          item.type === 'video' ? <Video className="h-20 w-20 text-[#166534]/20" /> :
                            <BookOpen className="h-20 w-20 text-[#166534]/20" />}
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePlay(item)}
                        className="w-14 h-14 md:w-24 md:h-24 rounded-full bg-[#166534] text-white flex items-center justify-center shadow-2xl cursor-pointer transition-colors"
                      >
                        <Play className="h-6 w-6 md:h-10 md:w-10 fill-current ml-0.5 md:ml-1" />
                      </motion.div>
                    </div>

                    {item.language && (
                      <div className="absolute top-2 right-2 md:top-6 md:right-6">
                        <Badge className="bg-[#166534] text-white font-urdu text-xs md:text-lg px-2 py-1 md:px-5 md:py-2 rounded-lg md:rounded-2xl shadow-lg border-none">
                          {item.language}
                        </Badge>
                      </div>
                    )}

                    {/* Info Bar at the bottom of the image */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#717474]/60 backdrop-blur-sm px-3 py-2 md:px-6 md:py-3 flex justify-between items-center text-white font-bold">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-sm">{item.date ? new Date(item.date).getFullYear() : '2026'}</span>
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-sm">{formatDuration(item.duration)}</span>
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-3 md:p-5 flex-1 flex flex-col justify-between bg-white">
                    <div className="mb-3 md:mb-4">
                      <h3 className="font-urdu text-base md:text-xl lg:text-2xl font-bold text-[#1a1a1a] text-center leading-relaxed group-hover:text-[#166534] transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </div>

                    {/* Download Button */}
                    <Button
                      variant="outline"
                      className="w-full h-10 md:h-12 rounded-full border border-[#e5e7eb] hover:border-[#166534]/50 hover:bg-[#166534]/5 group/btn transition-all duration-300 flex items-center justify-center gap-2 md:gap-4 px-4 md:px-8"
                      onClick={() => handleDownload(item.file_url, item.title)}
                    >
                      <Download className="h-4 w-4 md:h-6 md:w-6 text-[#9ca3af] group-hover/btn:text-[#166534] transition-colors" />
                      <div className="flex items-center gap-1 md:gap-2 font-bold text-[10px] md:text-lg text-[#374151]">
                        <span>{formatFileSize(item.file_size).size}</span>
                        <span className="font-urdu">{formatFileSize(item.file_size).unit}</span>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

    </section>
  );
};
