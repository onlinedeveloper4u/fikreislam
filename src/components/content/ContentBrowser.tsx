import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getSignedUrl } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { MediaPlayer } from './MediaPlayer';
import { useTranslation } from 'react-i18next';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Play, FileText, Music, Video,
  Loader2, Filter, X, User, Calendar, Heart, ListPlus
} from 'lucide-react';

type ContentType = 'book' | 'audio' | 'video';

interface Content {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  type: ContentType;
  language: string | null;
  tags: string[] | null;
  file_url: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

interface ContentWithSignedUrls extends Content {
  signed_file_url?: string | null;
  signed_cover_url?: string | null;
}

interface ContentBrowserProps {
  contentType: ContentType;
  title: string;
  description: string;
}

const LANGUAGES = ['تمام', 'انگریزی', 'عربی', 'اردو', 'ترکی', 'ملائی', 'انڈونیشیائی', 'فرانسیسی', 'ہسپانوی'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const LANGUAGE_MAP: Record<string, string> = {
  'تمام': 'all',
  'انگریزی': 'en',
  'عربی': 'ar',
  'اردو': 'ur',
  'ترکی': 'tr',
  'ملائی': 'ms',
  'انڈونیشیائی': 'id',
  'فرانسیسی': 'fr',
  'ہسپانوی': 'es'
};

export function ContentBrowser({ contentType, title, description }: ContentBrowserProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { trackDownload, trackPlay } = useAnalytics();
  const { t } = useTranslation();
  const [content, setContent] = useState<ContentWithSignedUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('تمام');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentWithSignedUrls | null>(null);

  const typeConfig: Record<ContentType, { icon: React.ElementType; actionLabel: string; actionIcon: React.ElementType }> = {
    book: { icon: FileText, actionLabel: t('content.browser.download'), actionIcon: Download },
    audio: { icon: Music, actionLabel: t('content.browser.play'), actionIcon: Play },
    video: { icon: Video, actionLabel: t('content.browser.watch'), actionIcon: Play },
  };

  const config = typeConfig[contentType];
  const TypeIcon = config.icon;

  useEffect(() => {
    fetchContent();
  }, [contentType]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, description, author, type, language, tags, file_url, cover_image_url, published_at')
        .eq('status', 'approved')
        .eq('type', contentType)
        .order('published_at', { ascending: false });

      if (error) throw error;

      const contentWithSignedUrls = await Promise.all(
        ((data as Content[]) || []).map(async (item) => {
          const [signedFileUrl, signedCoverUrl] = await Promise.all([
            getSignedUrl(item.file_url),
            getSignedUrl(item.cover_image_url)
          ]);
          return {
            ...item,
            signed_file_url: signedFileUrl,
            signed_cover_url: signedCoverUrl
          };
        })
      );

      setContent(contentWithSignedUrls);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    content.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [content]);

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLanguage = selectedLanguage === 'تمام' || item.language === selectedLanguage;
      const matchesTag = !selectedTag || item.tags?.includes(selectedTag);

      return matchesSearch && matchesLanguage && matchesTag;
    });
  }, [content, searchQuery, selectedLanguage, selectedTag]);

  const handleAction = (item: ContentWithSignedUrls) => {
    if (item.type === 'book') {
      trackDownload(item.id);
    } else {
      trackPlay(item.id);
    }
    setSelectedItem(item);
    setPlayerOpen(true);
  };

  const handleAddToPlaylist = (contentId: string) => {
    if (!user) return;
    setSelectedContentId(contentId);
    setPlaylistDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('تمام');
    setSelectedTag(null);
  };

  const hasActiveFilters = searchQuery || selectedLanguage !== 'تمام' || selectedTag;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative py-8"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10 blur-3xl opacity-50" />
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-[2rem] gradient-primary flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20"
        >
          <TypeIcon className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed opacity-80">
          {description}
        </p>
      </motion.div>

      {/* Search and Filters Hub */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="flex flex-col lg:flex-row gap-6 bg-card/40 p-6 rounded-3xl glass-dark border border-border/50 shadow-xl"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={t('content.browser.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-background/50 border-border/40 focus:border-primary/50 text-lg transition-all rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full sm:w-56 h-14 bg-background/50 border-border/40 rounded-2xl text-base">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 opacity-50" />
                <SelectValue placeholder={t('content.browser.language')} />
              </div>
            </SelectTrigger>
            <SelectContent className="glass-dark rounded-2xl">
              {LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang} className="h-10">
                  {t(`common.languages.${LANGUAGE_MAP[lang]}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <Select value={selectedTag || '_all'} onValueChange={(v) => setSelectedTag(v === '_all' ? null : v)}>
              <SelectTrigger className="w-full sm:w-56 h-14 bg-background/50 border-border/40 rounded-2xl text-base">
                <SelectValue placeholder={t('content.browser.allTags')} />
              </SelectTrigger>
              <SelectContent className="glass-dark rounded-2xl">
                <SelectItem value="_all" className="h-10">{t('content.browser.allTags')}</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag} className="h-10">{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-14 w-14 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Results HUD */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="uppercase text-[11px] opacity-70">
            {t('content.browser.itemsFoundCount', { count: filteredContent.length })}
          </span>
        </div>
        {hasActiveFilters && (
          <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0 font-bold hover:text-primary transition-colors text-[11px] uppercase tracking-wider">
            {t('content.browser.clearFilters')}
          </Button>
        )}
      </div>

      {/* Content Canvas */}
      {filteredContent.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 glass-dark rounded-[3rem] border-2 border-dashed border-border/30"
        >
          <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-8">
            <Filter className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">{t('content.browser.noContentFound')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-lg opacity-70">
            {content.length === 0
              ? t('content.browser.noApprovedContent')
              : t('content.browser.adjustSearch')}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
        >
          {filteredContent.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              <Card
                className="group border-border/30 bg-card/40 glass-dark hover-lift overflow-hidden h-full flex flex-col transition-all duration-700 hover:border-primary/40 rounded-[2.5rem] shadow-lg hover:shadow-primary/5"
              >
                {/* Visual Anchor */}
                <div className="aspect-[3/4] relative bg-muted/20 overflow-hidden">
                  {item.signed_cover_url || item.cover_image_url ? (
                    <img
                      src={item.signed_cover_url || item.cover_image_url || ''}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <TypeIcon className="h-24 w-24 text-primary/10" />
                    </div>
                  )}

                  {/* Glass Experience Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[6px]">
                    <Button
                      onClick={() => handleAction(item)}
                      size="lg"
                      className="rounded-full h-16 px-8 text-lg font-bold shadow-2xl hover:scale-110 active:scale-95 transition-all gradient-primary border-none"
                    >
                      <config.actionIcon className="h-6 w-6 mr-3" />
                      {config.actionLabel}
                    </Button>
                  </div>

                  {user && (
                    <div className="absolute top-4 right-4 flex flex-col gap-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 glass border border-white/20 text-white hover:bg-white/30 hover:scale-110 transition-all rounded-2xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                      >
                        <Heart className={`h-5 w-5 ${isFavorite(item.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 glass border border-white/20 text-white hover:bg-white/30 hover:scale-110 transition-all rounded-2xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(item.id);
                        }}
                      >
                        <ListPlus className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {item.language && (
                    <Badge className="absolute bottom-4 left-4 glass border border-white/20 text-white bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                      {item.language}
                    </Badge>
                  )}
                </div>

                {/* Content Details */}
                <CardContent className="p-8 flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-xl text-foreground line-clamp-2 mb-4 group-hover:text-primary transition-colors leading-tight min-h-[3.5rem]">
                    {item.title}
                  </h3>

                  <div className="space-y-4 flex-1">
                    {item.author && (
                      <p className="text-sm text-primary/60 flex items-center gap-2.5 font-bold uppercase tracking-tighter">
                        <User className="h-4 w-4" />
                        {item.author}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-sm text-muted-foreground/60 line-clamp-2 leading-relaxed italic">
                        "{item.description}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-6 border-t border-border/20 mt-8">
                    {item.tags?.slice(0, 3).map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px] font-black tracking-[0.1em] uppercase px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border-transparent transition-all cursor-pointer rounded-lg"
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {item.published_at && (
                      <div className="text-[10px] text-muted-foreground/40 flex items-center gap-2 ml-auto font-black tracking-widest uppercase">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.published_at).getFullYear()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {selectedContentId && playlistDialogOpen && (
          <AddToPlaylistDialog
            contentId={selectedContentId}
            open={playlistDialogOpen}
            onOpenChange={setPlaylistDialogOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && playerOpen && (
          <MediaPlayer
            isOpen={playerOpen}
            onClose={() => setPlayerOpen(false)}
            title={selectedItem.title}
            url={selectedItem.signed_file_url || selectedItem.file_url}
            type={selectedItem.type}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
