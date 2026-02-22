import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Pencil, Check, X, Music } from 'lucide-react';
import { renameFolderInGoogleDrive, createFolderInGoogleDrive } from '@/lib/storage';

interface AudioType {
    id: string;
    name: string;
    google_folder_id: string | null;
    updated_at: string;
}

export function AudioTypeManagement() {
    const { t } = useTranslation();
    const [audioTypes, setAudioTypes] = useState<AudioType[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchAudioTypes();
    }, []);

    const fetchAudioTypes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audio_types')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setAudioTypes(data || []);
        } catch (error: any) {
            console.error('Error fetching audio types:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddAudioType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setActionLoading('add');
        try {
            const exists = audioTypes.some(a => a.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) {
                throw new Error(t('dashboard.taxonomyManagement.duplicateError'));
            }

            // Google Drive Folder Automation (for general organization)
            // While audio types are usually within speaker folders, having a top-level ID 
            // can help in direct lookups or future refactors.
            const result = await createFolderInGoogleDrive(newName.trim());

            const { error } = await supabase
                .from('audio_types')
                .insert({
                    name: newName.trim(),
                    google_folder_id: result.folderId || null
                });

            if (error) throw error;

            toast.success(t('common.success'));
            setNewName('');
            fetchAudioTypes();
        } catch (error: any) {
            console.error('Add error:', error);
            toast.error(error.message || t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim()) return;

        setActionLoading(id);
        try {
            const itemToEdit = audioTypes.find(a => a.id === id);
            const exists = audioTypes.some(a => a.id !== id && a.name.toLowerCase() === editName.trim().toLowerCase());
            if (exists) {
                throw new Error(t('dashboard.taxonomyManagement.duplicateError'));
            }

            const { error } = await supabase
                .from('audio_types')
                .update({
                    name: editName.trim()
                })
                .eq('id', id);

            if (error) throw error;

            const oldName = itemToEdit?.name;
            const updatedName = editName.trim();

            if (oldName && oldName !== updatedName) {
                // 1. Cascade update to content table
                await supabase
                    .from('content')
                    .update({ audio_type: updatedName })
                    .eq('audio_type', oldName);

                // 2. Google Drive Sync for subfolders
                const { data: contentData } = await supabase.from('content').select('speaker').eq('audio_type', updatedName);
                if (contentData) {
                    const uniqueSpeakers = Array.from(new Set(contentData.map(s => s.speaker).filter(Boolean)));
                    for (const s of uniqueSpeakers) {
                        if (s) await renameFolderInGoogleDrive(`فکر اسلام/${s}/${oldName}`, updatedName);
                    }
                }
            }

            toast.success(t('common.success'));
            setEditingId(null);
            setEditName('');
            fetchAudioTypes();
        } catch (error: any) {
            console.error('Edit error:', error);
            toast.error(error.message || t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(t('dashboard.taxonomyManagement.confirmDelete', { name }))) return;

        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('audio_types')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success(t('common.success'));
            setAudioTypes(prev => prev.filter(a => a.id !== id));
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle>{t('dashboard.taxonomyManagement.types.audio_type')}</CardTitle>
                    <CardDescription>{t('dashboard.taxonomyManagement.descriptions.audio_type')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddAudioType} className="flex gap-4 items-end mb-8">
                    <div className="space-y-2 flex-1">
                        <Label>{t('dashboard.taxonomyManagement.name')}</Label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('dashboard.taxonomyManagement.placeholder', { type: t('dashboard.taxonomyManagement.types.audio_type') })}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={actionLoading === 'add'}>
                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {t('dashboard.taxonomyManagement.add')}</>}
                    </Button>
                </form>

                <div className="grid gap-2">
                    {audioTypes.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 border rounded-md group">
                            {editingId === item.id ? (
                                <div className="flex-1 flex items-center">
                                    <div className="flex-1">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-8"
                                            placeholder="Name"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleEdit(item.id)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                            setEditingId(item.id);
                                            setEditName(item.name);
                                        }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id, item.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {audioTypes.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground italic">
                            {t('dashboard.taxonomyManagement.noItems', { type: t('dashboard.taxonomyManagement.types.audio_type') })}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
