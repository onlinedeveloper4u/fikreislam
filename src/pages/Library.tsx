import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus, Trash2, Download, Play, User
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function Library() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { playlists, createPlaylist, deletePlaylist, removeFromPlaylist, loading: playlistLoading } = usePlaylists();
  
  const [favoriteContent, setFavoriteContent] = useState<Content[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistContent, setPlaylistContent] = useState<Content[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
      // Use content_public view to avoid exposing sensitive fields
      const { data, error } = await supabase
        .from('content_public')
        .select('id, title, description, author, type, language, file_url, cover_image_url')
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
        // Use content_public view to avoid exposing sensitive fields
        const { data, error } = await supabase
          .from('content_public')
          .select('id, title, description, author, type, language, file_url, cover_image_url')
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
    if (item.file_url) {
      window.open(item.file_url, '_blank');
    }
  };

  if (authLoading || favLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const ContentCard = ({ item, showRemove = false, onRemove }: { item: Content; showRemove?: boolean; onRemove?: () => void }) => {
    const TypeIcon = typeIcons[item.type];
    
    return (
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <div className="flex gap-4 p-4">
          <div className="w-20 h-28 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground line-clamp-1">{item.title}</h4>
            {item.author && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {item.author}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize text-xs">
                {item.type}
              </Badge>
              {item.language && (
                <Badge variant="outline" className="text-xs">
                  {item.language}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={() => handleAction(item)}>
                {item.type === 'book' ? <Download className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                {item.type === 'book' ? 'Download' : 'Play'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => toggleFavorite(item.id)}
              >
                <Heart className={`h-3 w-3 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              {showRemove && onRemove && (
                <Button size="sm" variant="ghost" onClick={onRemove}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground mt-2">Your saved favorites and playlists</p>
        </div>

        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorites ({favorites.size})
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              Playlists ({playlists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Favorites
                </CardTitle>
                <CardDescription>Content you've saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingContent ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : favoriteContent.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No favorites yet. Browse content and click the heart icon to save.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteContent.map((item) => (
                      <ContentCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playlists">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Playlists sidebar */}
              <Card className="border-border/50 bg-card/50 backdrop-blur md:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">My Playlists</CardTitle>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Playlist</DialogTitle>
                          <DialogDescription>Give your new playlist a name</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                          />
                          <Button onClick={handleCreatePlaylist} className="w-full">
                            Create
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {playlistLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : playlists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No playlists yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedPlaylist?.id === playlist.id
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handlePlaylistSelect(playlist)}
                        >
                          <div>
                            <p className="font-medium">{playlist.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {playlist.item_count} {playlist.item_count === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlaylist(playlist.id);
                              if (selectedPlaylist?.id === playlist.id) {
                                setSelectedPlaylist(null);
                                setPlaylistContent([]);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Playlist content */}
              <Card className="border-border/50 bg-card/50 backdrop-blur md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedPlaylist ? selectedPlaylist.name : 'Select a playlist'}
                  </CardTitle>
                  <CardDescription>
                    {selectedPlaylist 
                      ? `${playlistContent.length} items in this playlist`
                      : 'Choose a playlist to view its content'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedPlaylist ? (
                    <p className="text-center text-muted-foreground py-8">
                      Select a playlist from the left to view its content
                    </p>
                  ) : loadingContent ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : playlistContent.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      This playlist is empty. Browse content and add items to it.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {playlistContent.map((item) => (
                        <ContentCard 
                          key={item.id} 
                          item={item} 
                          showRemove 
                          onRemove={() => handleRemoveFromPlaylist(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}