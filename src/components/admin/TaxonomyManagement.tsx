import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

export type TaxonomyType = 'speaker' | 'language' | 'audio_type' | 'category';

interface Taxonomy {
    id: string;
    type: TaxonomyType;
    name: string;
}

export function TaxonomyManagement() {
    const { t } = useTranslation();
    const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newName, setNewName] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Default active tab
    const [activeTab, setActiveTab] = useState<TaxonomyType>('speaker');

    useEffect(() => {
        fetchTaxonomies();
    }, []);

    const fetchTaxonomies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('taxonomies')
                .select('*')
                .order('type', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            setTaxonomies(data || []);
        } catch (error: any) {
            console.error('Error fetching taxonomies:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddTaxonomy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setActionLoading('add');
        try {
            // Check for existence first to avoid 409 console error
            const exists = taxonomies.some(t => t.type === activeTab && t.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) {
                throw new Error(t('dashboard.taxonomyManagement.duplicateError', { defaultValue: 'یہ نام پہلے سے موجود ہے' }));
            }

            const { error } = await supabase
                .from('taxonomies')
                .upsert({ type: activeTab, name: newName.trim() }, { onConflict: 'type,name' });

            if (error) {
                if (error.code === '23505') {
                    throw new Error(t('dashboard.taxonomyManagement.duplicateError', { defaultValue: 'یہ نام پہلے سے موجود ہے' }));
                }
                throw error;
            }

            toast.success(t('common.success'));
            setNewName('');
            fetchTaxonomies();
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
            // Check for existence first to avoid 409 console error
            const itemToEdit = taxonomies.find(t => t.id === id);
            const exists = taxonomies.some(t => t.id !== id && t.type === itemToEdit?.type && t.name.toLowerCase() === editName.trim().toLowerCase());
            if (exists) {
                throw new Error(t('dashboard.taxonomyManagement.duplicateError', { defaultValue: 'یہ نام پہلے سے موجود ہے' }));
            }

            const { error } = await supabase
                .from('taxonomies')
                .update({ name: editName.trim() })
                .eq('id', id);

            if (error) {
                if (error.code === '23505') {
                    throw new Error(t('dashboard.taxonomyManagement.duplicateError', { defaultValue: 'یہ نام پہلے سے موجود ہے' }));
                }
                throw error;
            }

            toast.success(t('common.success'));
            setEditingId(null);
            setEditName('');
            // Update locally (we already have the type from taxonomies)
            setTaxonomies(prev => prev.map(item =>
                item.id === id ? { ...item, name: editName.trim() } : item
            ));
        } catch (error: any) {
            console.error('Edit error:', error);
            toast.error(error.message || t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    const startEditing = (item: Taxonomy) => {
        setEditingId(item.id);
        setEditName(item.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(t('dashboard.taxonomyManagement.confirmDelete', { name }))) return;

        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('taxonomies')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success(t('common.success'));
            setTaxonomies(prev => prev.filter(t => t.id !== id));
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    const groupedTaxonomies = taxonomies.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = [];
        acc[curr.type].push(curr);
        return acc;
    }, {} as Record<TaxonomyType, Taxonomy[]>);

    const typeLabels: Record<TaxonomyType, string> = {
        speaker: t('dashboard.taxonomyManagement.types.speaker'),
        language: t('dashboard.taxonomyManagement.types.language'),
        audio_type: t('dashboard.taxonomyManagement.types.audio_type'),
        category: t('dashboard.taxonomyManagement.types.category'),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.taxonomyManagement.title')}</CardTitle>
                    <CardDescription>{t('dashboard.taxonomyManagement.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val as TaxonomyType); setNewName(''); cancelEditing(); }} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 md:grid-cols-4 overflow-x-auto h-auto min-h-[40px] p-1">
                            {(Object.keys(typeLabels) as TaxonomyType[]).map((type) => (
                                <TabsTrigger key={type} value={type} className="flex-1 whitespace-nowrap px-3 py-1.5 text-sm">
                                    {t(`dashboard.taxonomyManagement.types.${type}`)}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {(Object.keys(typeLabels) as TaxonomyType[]).map((type) => (
                            <TabsContent key={type} value={type} className="pt-6">
                                <form onSubmit={handleAddTaxonomy} className="flex gap-4 items-end mb-8 relative">
                                    <div className="space-y-2 flex-1 relative">
                                        <Label>{t('dashboard.taxonomyManagement.name')}</Label>
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder={t('dashboard.taxonomyManagement.placeholder', { type: t(`dashboard.taxonomyManagement.types.${type}`) })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={actionLoading === 'add'} className="w-[120px] shrink-0">
                                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2 shrink-0" /> {t('dashboard.taxonomyManagement.add')}</>}
                                    </Button>
                                </form>

                                <div className="border rounded-md p-4 bg-muted/20">
                                    <h3 className="font-semibold text-lg mb-4">{t(`dashboard.taxonomyManagement.types.${type}`)}</h3>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {groupedTaxonomies[type]?.map((item: Taxonomy) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-background border rounded-md shadow-sm gap-3">
                                                {editingId === item.id ? (
                                                    <>
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="flex-1 h-8"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') { e.preventDefault(); handleEdit(item.id); }
                                                                if (e.key === 'Escape') cancelEditing();
                                                            }}
                                                        />
                                                        <div className="flex gap-1 shrink-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                onClick={() => handleEdit(item.id)}
                                                                disabled={actionLoading === item.id}
                                                            >
                                                                {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                onClick={cancelEditing}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-medium flex-1">{item.name}</span>
                                                        <div className="flex gap-1 shrink-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                onClick={() => startEditing(item)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDelete(item.id, item.name)}
                                                                disabled={actionLoading === item.id}
                                                            >
                                                                {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {(!groupedTaxonomies[type] || groupedTaxonomies[type].length === 0) && (
                                            <p className="text-sm text-muted-foreground italic text-center py-8 bg-background/50 rounded-md border border-dashed">
                                                {t('dashboard.taxonomyManagement.noItems', { type: t(`dashboard.taxonomyManagement.types.${type}`) })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
