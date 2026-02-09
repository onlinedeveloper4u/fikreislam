import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  item_count?: number;
}

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPlaylists = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get item counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (data || []).map(async (playlist) => {
          const { count } = await supabase
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);
          
          return { ...playlist, item_count: count || 0 };
        })
      );
      
      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = useCallback(async (name: string, description?: string) => {
    if (!user) {
      toast.error('Please sign in to create playlists');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({ user_id: user.id, name, description: description || null })
        .select()
        .single();

      if (error) throw error;
      
      setPlaylists(prev => [{ ...data, item_count: 0 }, ...prev]);
      toast.success('Playlist created');
      return data;
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
      return null;
    }
  }, [user]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;
      
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      toast.success('Playlist deleted');
    } catch (error: any) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  }, []);

  const addToPlaylist = useCallback(async (playlistId: string, contentId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .insert({ playlist_id: playlistId, content_id: contentId });

      if (error) {
        if (error.code === '23505') {
          toast.info('Item already in playlist');
          return;
        }
        throw error;
      }
      
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId ? { ...p, item_count: (p.item_count || 0) + 1 } : p
      ));
      toast.success('Added to playlist');
    } catch (error: any) {
      console.error('Error adding to playlist:', error);
      toast.error('Failed to add to playlist');
    }
  }, []);

  const removeFromPlaylist = useCallback(async (playlistId: string, contentId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('content_id', contentId);

      if (error) throw error;
      
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId ? { ...p, item_count: Math.max(0, (p.item_count || 0) - 1) } : p
      ));
      toast.success('Removed from playlist');
    } catch (error: any) {
      console.error('Error removing from playlist:', error);
      toast.error('Failed to remove from playlist');
    }
  }, []);

  return { 
    playlists, 
    loading, 
    createPlaylist, 
    deletePlaylist, 
    addToPlaylist, 
    removeFromPlaylist,
    refetch: fetchPlaylists 
  };
}