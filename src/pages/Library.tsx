import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { MediaPlayer } from '@/components/content/MediaPlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Heart, ListMusic, FileText, Music, Video, Loader2,
  Plus, Trash2, Download, Play, User, Bookmark
} from 'lucide-react';

type ContentType = 'book' | 'audio' | 'video';

interface Content {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  type: ContentType;
  language: string | null;
  file_url: string | null;
  cover_image_url: string | null;
}

const typeIcons: Record<ContentType, React.ElementType> = {
  book: FileText,
  audio: Music,
  video: Video,
};

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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function Library() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { playlists, createPlaylist, deletePlaylist, removeFromPlaylist, loading: playlistLoading } = usePlaylists();
  const { t } = useTranslation();

  const [favoriteContent, setFavoriteContent] = useState<Content[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistContent, setPlaylistContent] = useState<Content[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Content | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (favorites.size > 0) {
      fetchFavoriteContent();
    } else {
      setFavoriteContent([]);
    }
  }, [favorites]);

  const fetchFavoriteContent = async () => {
    setLoadingContent(true);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, description, author, type, language, file_url, cover_image_url')
        .eq('status', 'approved')
        .in('id', Array.from(favorites));

      if (error) throw error;
      setFavoriteContent((data as Content[]) || []);
    } catch (error) {
      console.error('Error fetching favorite content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchPlaylistContent = async (playlistId: string) => {
    setLoadingContent(true);
    try {
      const { data: items, error: itemsError } = await supabase
        .from('playlist_items')
        .select('content_id')
        .eq('playlist_id', playlistId)
        .order('position');

      if (itemsError) throw itemsError;

      if (items && items.length > 0) {
        const { data, error } = await supabase
          .from('content')
          .select('id, title, description, author, type, language, file_url, cover_image_url')
          .eq('status', 'approved')
          .in('id', items.map(i => i.content_id));

        if (error) throw error;
        setPlaylistContent((data as Content[]) || []);
      } else {
        setPlaylistContent([]);
      }
    } catch (error) {
      console.error('Error fetching playlist content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    fetchPlaylistContent(playlist.id);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setCreateDialogOpen(false);
  };

  const handleRemoveFromPlaylist = async (contentId: string) => {
    if (!selectedPlaylist) return;
    await removeFromPlaylist(selectedPlaylist.id, contentId);
    setPlaylistContent(prev => prev.filter(c => c.id !== contentId));
  };

  const handleAction = (item: Content) => {
    setSelectedItem(item);
    setPlayerOpen(true);
  };

  if (authLoading || favLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const ContentCard = ({ item, showRemove = false, onRemove }: { item: Content; showRemove?: boolean; onRemove?: () => void }) => {
    const TypeIcon = typeIcons[item.type];

    return (
      <motion.div variants={itemVariants}>
        <Card className="group border-border/40 bg-card/30 glass-dark hover-lift overflow-hidden transition-all duration-500 hover:border-primary/30 rounded-2xl">
          <div className="flex gap-4 p-4">
            <div className="w-24 h-32 rounded-xl bg-muted/20 flex-shrink-0 overflow-hidden relative shadow-inner">
              {item.cover_image_url ? (
                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <TypeIcon className="h-10 w-10 text-primary/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="icon" variant="ghost" className="text-white hover:scale-125 transition-transform" onClick={() => handleAction(item)}>
                  {item.type === 'book' ? <Download className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <h4 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight">{item.title}</h4>
                {item.author && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5 font-medium opacity-80">
                    <User className="h-3.5 w-3.5 text-primary/70" />
                    {item.author}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-wider px-2 py-0.5 bg-primary/5 text-primary border-none">
                    {item.type}
                  </Badge>
                  {item.language && (
                    <Badge className="text-[10px] font-bold tracking-wider px-2 py-0.5 glass border border-white/10 text-white bg-black/20">
                      {item.language}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/20">
                <Button size="sm" onClick={() => handleAction(item)} className="h-9 rounded-xl font-bold shadow-lg shadow-primary/10 flex-1">
                  {item.type === 'book' ? <Download className="h-3.5 w-3.5 mr-2" /> : <Play className="h-3.5 w-3.5 mr-2" />}
                  {item.type === 'book' ? t('library.content.download') : t('library.content.play')}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  onClick={() => toggleFavorite(item.id)}
                >
                  <Heart className={`h-4.5 w-4.5 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                {showRemove && onRemove && (
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors" onClick={onRemove}>
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 relative"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/20">
                  <Bookmark className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">{t('library.title')}</h1>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl opacity-80 leading-relaxed font-medium">{t('library.subtitle')}</p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl h-14 px-8 text-base font-bold shadow-xl shadow-primary/10 hover:scale-105 transition-all">
                  <Plus className="h-5 w-5 mr-3" />
                  {t('library.playlists.createTitle')}
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dark border-border/50 rounded-[2rem] p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display font-bold">{t('library.playlists.createTitle')}</DialogTitle>
                  <DialogDescription className="text-lg opacity-70">{t('library.playlists.createDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  <Input
                    placeholder={t('library.playlists.namePlaceholder')}
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                    className="h-14 bg-background/50 border-border/40 focus:border-primary/50 text-lg rounded-2xl"
                  />
                  <Button onClick={handleCreatePlaylist} className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary border-none shadow-xl shadow-primary/20">
                    {t('common.create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="h-1.5 w-32 bg-primary/20 rounded-full mt-10" />
        </motion.div>

        <Tabs defaultValue="favorites" className="space-y-10">
          <TabsList className="flex w-fit bg-card/40 p-1.5 rounded-2xl glass-dark border border-border/40 shadow-xl overflow-hidden">
            <TabsTrigger value="favorites" className="flex items-center gap-3 px-8 py-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-base font-bold">
              <Heart className="h-5 w-5" />
              {t('library.tabs.favorites')}
              <Badge variant="outline" className="ml-2 bg-background/10 border-white/10 text-inherit text-[10px] font-black">{favorites.size}</Badge>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-3 px-8 py-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-base font-bold">
              <ListMusic className="h-5 w-5" />
              {t('library.tabs.playlists')}
              <Badge variant="outline" className="ml-2 bg-background/10 border-white/10 text-inherit text-[10px] font-black">{playlists.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-border/40 bg-card/30 glass-dark rounded-[2.5rem] shadow-2xl overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-display font-bold leading-tight">
                        {t('library.favorites.title')}
                      </CardTitle>
                      <CardDescription className="text-lg opacity-70 mt-1">{t('library.favorites.desc')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  {loadingContent ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground animate-pulse font-medium">{t('common.loading')}</p>
                    </div>
                  ) : favoriteContent.length === 0 ? (
                    <div className="text-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/30">
                      <Heart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                      <p className="text-xl font-bold text-muted-foreground">
                        {t('library.favorites.empty')}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                    >
                      {favoriteContent.map((item) => (
                        <ContentCard key={item.id} item={item} />
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="playlists" className="focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-3 gap-10"
            >
              <Card className="border-border/40 bg-card/30 glass-dark rounded-[2.5rem] shadow-2xl overflow-hidden lg:col-span-1 border-t-4 border-t-primary/20">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-display font-bold">{t('library.playlists.title')}</CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <ListMusic className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {playlistLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : playlists.length === 0 ? (
                    <div className="text-center py-12 bg-muted/10 rounded-2xl border-2 border-dashed border-border/30">
                      <p className="text-sm font-bold text-muted-foreground">
                        {t('library.playlists.empty')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {playlists.map((playlist) => (
                        <motion.div
                          key={playlist.id}
                          whileHover={{ x: 5 }}
                          className={`group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-300 ${selectedPlaylist?.id === playlist.id
                            ? 'bg-primary shadow-xl shadow-primary/20 text-primary-foreground border-none'
                            : 'bg-background/40 border border-border/40 hover:bg-background/60 hover:border-primary/30'
                            }`}
                          onClick={() => handlePlaylistSelect(playlist)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedPlaylist?.id === playlist.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                              <Music className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-lg leading-snug">{playlist.name}</p>
                              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${selectedPlaylist?.id === playlist.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {t('library.playlists.itemCount', { count: playlist.item_count })}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-10 w-10 rounded-xl transition-colors ${selectedPlaylist?.id === playlist.id ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-red-500/10 hover:text-red-500'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(t('common.confirmDelete'))) {
                                deletePlaylist(playlist.id);
                                if (selectedPlaylist?.id === playlist.id) {
                                  setSelectedPlaylist(null);
                                  setPlaylistContent([]);
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/30 glass-dark rounded-[2.5rem] shadow-2xl overflow-hidden lg:col-span-2 border-t-4 border-t-primary/20">
                <CardHeader className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-3xl font-display font-bold">
                        {selectedPlaylist ? selectedPlaylist.name : t('library.playlists.selectPrompt')}
                      </CardTitle>
                      <CardDescription className="text-lg opacity-70 mt-1">
                        {selectedPlaylist
                          ? t('library.playlists.itemCount', { count: playlistContent.length })
                          : t('library.playlists.selectPrompt')}
                      </CardDescription>
                    </div>
                    {selectedPlaylist && (
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <ListMusic className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  {!selectedPlaylist ? (
                    <div className="text-center py-32 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/30">
                      <ListMusic className="h-20 w-20 text-muted-foreground/20 mx-auto mb-6" />
                      <p className="text-xl font-bold text-muted-foreground">
                        {t('library.playlists.selectPrompt')}
                      </p>
                    </div>
                  ) : loadingContent ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground animate-pulse font-medium">{t('common.loading')}</p>
                    </div>
                  ) : playlistContent.length === 0 ? (
                    <div className="text-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/30">
                      <Music className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                      <p className="text-xl font-bold text-muted-foreground">
                        {t('library.playlists.emptyPlaylist')}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-6 md:grid-cols-2"
                    >
                      {playlistContent.map((item) => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          showRemove
                          onRemove={() => handleRemoveFromPlaylist(item.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <AnimatePresence>
        {selectedItem && playerOpen && (
          <MediaPlayer
            isOpen={playerOpen}
            onClose={() => setPlayerOpen(false)}
            title={selectedItem.title}
            url={selectedItem.file_url}
            type={selectedItem.type}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}