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

const LANGUAGES = ['All', 'English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish'];

export function ContentBrowser({ contentType, title, description }: ContentBrowserProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { trackDownload, trackPlay } = useAnalytics();
  const { t } = useTranslation();
  const [content, setContent] = useState<ContentWithSignedUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
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

      const matchesLanguage = selectedLanguage === 'All' || item.language === selectedLanguage;
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
    setSelectedLanguage('All');
    setSelectedTag(null);
  };

  const hasActiveFilters = searchQuery || selectedLanguage !== 'All' || selectedTag;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const LANGUAGE_MAP: Record<string, string> = {
    'All': 'all',
    'English': 'en',
    'Arabic': 'ar',
    'Urdu': 'ur',
    'Turkish': 'tr',
    'Malay': 'ms',
    'Indonesian': 'id',
    'French': 'fr',
    'Spanish': 'es'
  };

  const LANGUAGES = ['All', 'English', 'Arabic', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French', 'Spanish'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <TypeIcon className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('content.browser.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('content.browser.language')} />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(lang => (
              <SelectItem key={lang} value={lang}>
                {t(`common.languages.${LANGUAGE_MAP[lang]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {allTags.length > 0 && (
          <Select value={selectedTag || '_all'} onValueChange={(v) => setSelectedTag(v === '_all' ? null : v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('content.browser.allTags')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('content.browser.allTags')}</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t('content.browser.itemsFoundCount', { count: filteredContent.length })}
        </span>
        {hasActiveFilters && (
          <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0">
            {t('content.browser.clearFilters')}
          </Button>
        )}
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('content.browser.noContentFound')}</h3>
          <p className="text-sm text-muted-foreground">
            {content.length === 0
              ? t('content.browser.noApprovedContent')
              : t('content.browser.adjustSearch')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors overflow-hidden group"
            >
              {/* Cover Image */}
              <div className="aspect-[3/4] relative bg-muted">
                {item.signed_cover_url || item.cover_image_url ? (
                  <img
                    src={item.signed_cover_url || item.cover_image_url || ''}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                {user && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 backdrop-blur"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite(item.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 backdrop-blur"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(item.id);
                      }}
                    >
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button onClick={() => handleAction(item)} size="lg">
                    <config.actionIcon className="h-5 w-5 mr-2" />
                    {config.actionLabel}
                  </Button>
                </div>
              </div>

              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>

                {item.author && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.author}
                  </p>
                )}

                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 pt-2">
                  {item.language && (
                    <Badge variant="secondary" className="text-xs">
                      {item.language}
                    </Badge>
                  )}
                  {item.tags?.slice(0, 2).map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-primary/10"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {item.published_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.published_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedContentId && (
        <AddToPlaylistDialog
          contentId={selectedContentId}
          open={playlistDialogOpen}
          onOpenChange={setPlaylistDialogOpen}
        />
      )}

      {selectedItem && (
        <MediaPlayer
          isOpen={playerOpen}
          onClose={() => setPlayerOpen(false)}
          title={selectedItem.title}
          url={selectedItem.signed_file_url || selectedItem.file_url}
          type={selectedItem.type}
        />
      )}
    </div>
  );
}
