'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ListMusic, Music, Loader2,
  Plus, Trash2, Play, Download, User, Bookmark, X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaPlayer } from '@/components/content/MediaPlayer';
import { useLibraryLogic, Content } from './logic';

const typeIcons: Record<string, React.ElementType> = {
  book: Music, // Placeholder if icon is missing
  audio: Music,
  video: Play,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
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
} as const;

export const LibraryView = () => {
  const {
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
    toggleFavorite,
    deletePlaylist,
    handlePlaylistSelect,
    handleCreatePlaylist,
    handleRemoveFromPlaylist,
    handleAction,
  } = useLibraryLogic();

  if (authLoading || favLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">{"لوڈ ہو رہا ہے..."}</p>
      </div>
    );
  }

  if (!user) return null;

  const ContentCard = ({ item, showRemove = false, onRemove }: { item: Content; showRemove?: boolean; onRemove?: () => void }) => {
    const TypeIcon = typeIcons[item.type] || Music;

    return (
      <motion.div variants={itemVariants}>
        <Card className="library-content-card">
          <div className="flex gap-4 p-4">
            <div className="library-card-image-container">
              {item.cover_image_url ? (
                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <TypeIcon className="h-10 w-10 text-primary/10" />
                </div>
              )}
              <div className="library-card-overlay">
                <Button size="icon" variant="ghost" className="text-white hover:scale-125 transition-transform" onClick={() => handleAction(item)}>
                  {item.type === 'book' ? <Download className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <h4 className="library-card-title">{item.title}</h4>
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
                  {item.type === 'book' ? "حاصل کریں" : "چلائیں"}
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
    <div className="library-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="library-header"
      >
        <div className="library-header-content">
          <div>
            <div className="library-title-container">
              <div className="library-icon-wrapper">
                <Bookmark className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="library-title">{"میرا کتب خانہ"}</h1>
            </div>
            <p className="library-description">{"روحانی سیکھنے کے لیے آپ کی ذاتی جگہ۔ اپنے محفوظ کردہ پسندیدہ اور مرضی کی فہرستوں تک رسائی حاصل کریں۔"}</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-14 px-8 text-base font-bold shadow-xl shadow-primary/10 hover:scale-105 transition-all">
                <Plus className="h-5 w-5 mr-3" />
                {"فہرست بنائیں"}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-dark border-border/50 rounded-[2rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-bold">{"فہرست بنائیں"}</DialogTitle>
                <DialogDescription className="text-lg opacity-70">{"اپنے مواد کو مرضی کی فہرستوں میں منظم کریں۔"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <Input
                  placeholder={"فہرست کا نام"}
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  className="h-14 bg-background/50 border-border/40 focus:border-primary/50 text-lg rounded-2xl"
                />
                <Button onClick={handleCreatePlaylist} className="w-full h-14 text-lg font-bold rounded-2xl gradient-primary border-none shadow-xl shadow-primary/20">
                  {"بنائیں"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="h-1.5 w-32 bg-primary/20 rounded-full mt-10" />
      </motion.div>

      <Tabs defaultValue="favorites" className="space-y-10">
        <TabsList className="library-tabs-list">
          <TabsTrigger value="favorites" className="library-tab-trigger">
            <Heart className="h-5 w-5" />
            {"پسندیدہ"}
            <Badge variant="outline" className="ml-2 bg-background/10 border-white/10 text-inherit text-[10px] font-black">{favorites.size}</Badge>
          </TabsTrigger>
          <TabsTrigger value="playlists" className="library-tab-trigger">
            <ListMusic className="h-5 w-5" />
            {"فہرستیں"}
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
                      {"آپ کے پسندیدہ"}
                    </CardTitle>
                    <CardDescription className="text-lg opacity-70 mt-1">{"فوری رسائی کے لیے آپ کا پسند کیا ہوا مواد۔"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                {loadingContent ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">{"لوڈ ہو رہا ہے..."}</p>
                  </div>
                ) : favoriteContent.length === 0 ? (
                  <div className="text-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/30">
                    <Heart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                    <p className="text-xl font-bold text-muted-foreground">
                      {"ابھی تک کوئی پسندیدہ نہیں ہے۔ ہوم پیج پر جائیں اور وہ مواد پسند کریں جو آپ کو اچھا لگے!"}
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
                  <CardTitle className="text-2xl font-display font-bold">{"آپ کی فہرستیں"}</CardTitle>
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
                      {"ابھی تک کوئی فہرست نہیں بنائی گئی ہے۔"}
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
                              {`${playlist.item_count} شے`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-10 w-10 rounded-xl transition-colors ${selectedPlaylist?.id === playlist.id ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-red-500/10 hover:text-red-500'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("کیا آپ واقعی اسے حذف کرنا چاہتے ہیں؟")) {
                              deletePlaylist(playlist.id);
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
                      {selectedPlaylist ? selectedPlaylist.name : "اس کے مواد کو دیکھنے کے لیے فہرست منتخب کریں"}
                    </CardTitle>
                    <CardDescription className="text-lg opacity-70 mt-1">
                      {selectedPlaylist
                        ? `${playlistContent.length} شے`
                        : "اس کے مواد کو دیکھنے کے لیے فہرست منتخب کریں"}
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
                      {"اس کے مواد کو دیکھنے کے لیے فہرست منتخب کریں"}
                    </p>
                  </div>
                ) : loadingContent ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">{"لوڈ ہو رہا ہے..."}</p>
                  </div>
                ) : playlistContent.length === 0 ? (
                  <div className="text-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/30">
                    <Music className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                    <p className="text-xl font-bold text-muted-foreground">
                      {"یہ فہرست خالی ہے۔"}
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
    </div>
  );
};
