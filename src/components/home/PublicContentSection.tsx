'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Video, BookOpen, Search, Download, Play,
  Calendar, Loader2, Clock, User, Filter, X
} from 'lucide-react';
import { getApprovedMedia } from '@/actions/media';
import { getWorks } from '@/actions/books';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { resolveItemPageUrl, resolveExternalUrl } from '@/lib/storage';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';

type ContentType = 'audio' | 'video' | 'book';

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  author?: string;
  description?: string;
  cover_image_url?: string;
  file_url?: string;
  file_size?: number;
  duration?: string;
  date?: string;
  language?: string;
}

export const PublicContentSection = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('audio');
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
      if (activeTab === 'book') {
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
        const typeMap = { 'audio': 'آڈیو', 'video': 'ویڈیو' };
        const { data, error } = await getApprovedMedia();
        if (data) {
          setItems(data
            .filter((m: any) => m.type === typeMap[activeTab])
            .map((m: any) => ({
              id: m.id,
              title: m.title,
              type: activeTab,
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
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
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
              { id: 'audio', label: 'آڈیو', icon: Music },
              { id: 'video', label: 'ویڈیو', icon: Video },
              { id: 'book', label: 'کتب', icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ContentType)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
          >
            {filteredItems.map((item, index) => (
              <motion.div key={item.id} variants={itemVariants}>
                <Card className="group border-none bg-card/40 glass-dark hover-lift overflow-hidden h-full flex flex-col rounded-[2.5rem] shadow-2xl transition-all duration-700">
                  <div className="aspect-[1/1.2] relative bg-muted/20 overflow-hidden">
                    {item.cover_image_url ? (
                      <Image
                        src={resolveExternalUrl(item.cover_image_url)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 4}
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        {item.type === 'audio' ? <Music className="h-20 w-20 text-primary/20" /> :
                          item.type === 'video' ? <Video className="h-20 w-20 text-primary/20" /> :
                            <BookOpen className="h-20 w-20 text-primary/20" />}
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePlay(item)}
                        className="w-24 h-24 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm cursor-pointer hover:bg-primary transition-colors"
                      >
                        <Play className="h-10 w-10 fill-current ml-1" />
                      </motion.div>
                    </div>

                    {item.language && (
                      <div className="absolute top-6 right-6">
                        <Badge className="bg-primary text-primary-foreground font-urdu text-lg px-5 py-2 rounded-2xl shadow-lg border-none">
                          {item.language}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="bg-foreground/5 backdrop-blur-md px-8 py-4 flex justify-between items-center border-y border-border/10">
                    <div className="flex items-center gap-2 text-muted-foreground font-bold">
                      <span className="text-sm">{item.date ? new Date(item.date).getFullYear() : '2026'}</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold">
                      <span className="text-sm">{formatDuration(item.duration)}</span>
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>

                  <CardContent className="p-8 flex-1 flex flex-col justify-between">
                    <div className="mb-8">
                      <h3 className="font-urdu text-3xl font-bold text-foreground text-right leading-relaxed group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.author && (
                        <p className="text-sm text-primary/60 text-right font-bold mt-2">
                          {item.author}
                        </p>
                      )}
                    </div>

                    {/* Download Button */}
                    <Button
                      variant="outline"
                      className="w-full h-16 rounded-[1.5rem] border-2 border-border/30 hover:border-primary/50 hover:bg-primary/5 group/btn transition-all duration-300 flex items-center justify-between px-8"
                      onClick={() => handleDownload(item.file_url, item.title)}
                    >
                      <Download className="h-6 w-6 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                      <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                        <span>{formatFileSize(item.file_size).unit}</span>
                        <span>{formatFileSize(item.file_size).size}</span>
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
