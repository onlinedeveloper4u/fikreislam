'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { supabase } from '@/integrations/supabase/client';

export type ContentType = 'book' | 'audio' | 'video';

export interface Content {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  type: ContentType;
  language: string | null;
  file_url: string | null;
  cover_image_url: string | null;
}

export const useLibraryLogic = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { playlists, createPlaylist, deletePlaylist, removeFromPlaylist, loading: playlistLoading } = usePlaylists();
  
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
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
          .in('id', (items as any[]).map(i => i.content_id));

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

  return {
    user,
    authLoading,
    favorites,
    playlists,
    favLoading,
    playlistLoading,
    favoriteContent,
    selectedPlaylist,
    playlistContent,
    loadingContent,
    newPlaylistName,
    setNewPlaylistName,
    createDialogOpen,
    setCreateDialogOpen,
    playerOpen,
    setPlayerOpen,
    selectedItem,
    setSelectedItem,
    toggleFavorite,
    deletePlaylist,
    handlePlaylistSelect,
    handleCreatePlaylist,
    handleRemoveFromPlaylist,
    handleAction,
  };
};
