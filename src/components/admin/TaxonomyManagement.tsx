import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2 } from 'lucide-react';

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

    const [newType, setNewType] = useState<TaxonomyType>('speaker');
    const [newName, setNewName] = useState('');

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
            const { error } = await supabase
                .from('taxonomies')
                .insert({ type: activeTab, name: newName.trim() }); // Use activeTab instead of newType

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    throw new Error(t('common.error')); // Need better specific string if wanted
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

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

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
        speaker: 'Speaker',
        language: 'Language',
        audio_type: 'Audio Type',
        category: 'Category',
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
                    <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val as TaxonomyType); setNewName(''); }} className="w-full">
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
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-background border rounded-md shadow-sm">
                                                <span className="text-sm font-medium">{item.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    disabled={actionLoading === item.id}
                                                >
                                                    {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
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
