import { useState } from 'react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListMusic, Plus, Loader2 } from 'lucide-react';

interface AddToPlaylistDialogProps {
  contentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToPlaylistDialog({ contentId, open, onOpenChange }: AddToPlaylistDialogProps) {
  const { playlists, loading, createPlaylist, addToPlaylist } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleAddToPlaylist = async (playlistId: string) => {
    await addToPlaylist(playlistId, contentId);
    onOpenChange(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    
    setIsCreating(true);
    const playlist = await createPlaylist(newPlaylistName.trim());
    if (playlist) {
      await addToPlaylist(playlist.id, contentId);
      setNewPlaylistName('');
      onOpenChange(false);
    }
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5" />
            Add to Playlist
          </DialogTitle>
          <DialogDescription>
            Choose an existing playlist or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new playlist */}
          <div className="space-y-2">
            <Label>Create new playlist</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
              />
              <Button 
                onClick={handleCreateAndAdd} 
                disabled={!newPlaylistName.trim() || isCreating}
                size="icon"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Existing playlists */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : playlists.length > 0 ? (
            <div className="space-y-2">
              <Label>Your playlists</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-primary/10 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {playlist.item_count} {playlist.item_count === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No playlists yet. Create one above!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
