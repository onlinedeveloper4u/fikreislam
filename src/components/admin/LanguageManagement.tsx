import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Pencil, Check, X, Globe } from 'lucide-react';

interface Language {
    id: string;
    name: string;
    updated_at: string;
}

export function LanguageManagement() {
    const { t } = useTranslation();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('languages')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setLanguages(data || []);
        } catch (error: any) {
            console.error('Error fetching languages:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddLanguage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setActionLoading('add');
        try {
            const exists = languages.some(l => l.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) {
                throw new Error(t('dashboard.taxonomyManagement.duplicateError'));
            }

            const { error } = await supabase
                .from('languages')
                .insert({ name: newName.trim() });

            if (error) throw error;

            toast.success(t('common.success'));
            setNewName('');
            fetchLanguages();
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
            const itemToEdit = languages.find(l => l.id === id);
            const exists = languages.some(l => l.id !== id && l.name.toLowerCase() === editName.trim().toLowerCase());
            if (exists) {
                throw new Error(t('dashboard.taxonomyManagement.duplicateError'));
            }

            const { error } = await supabase
                .from('languages')
                .update({ name: editName.trim() })
                .eq('id', id);

            if (error) throw error;

            // Cascade update to content table
            const oldName = itemToEdit?.name;
            const updatedName = editName.trim();
            if (oldName && oldName !== updatedName) {
                await supabase
                    .from('content')
                    .update({ language: updatedName })
                    .eq('language', oldName);
            }

            toast.success(t('common.success'));
            setEditingId(null);
            setEditName('');
            fetchLanguages();
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
                .from('languages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success(t('common.success'));
            setLanguages(prev => prev.filter(l => l.id !== id));
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
                    <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle>{t('dashboard.taxonomyManagement.types.language')}</CardTitle>
                    <CardDescription>{t('dashboard.taxonomyManagement.descriptions.language')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddLanguage} className="flex gap-4 items-end mb-8">
                    <div className="space-y-2 flex-1">
                        <Label>{t('dashboard.taxonomyManagement.name')}</Label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('dashboard.taxonomyManagement.placeholder', { type: t('dashboard.taxonomyManagement.types.language') })}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={actionLoading === 'add'}>
                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {t('dashboard.taxonomyManagement.add')}</>}
                    </Button>
                </form>

                <div className="grid gap-2">
                    {languages.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 border rounded-md group">
                            {editingId === item.id ? (
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-8"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleEdit(item.id)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium">{item.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(item.id); setEditName(item.name); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id, item.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {languages.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground italic">
                            {t('dashboard.taxonomyManagement.noItems', { type: t('dashboard.taxonomyManagement.types.language') })}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
