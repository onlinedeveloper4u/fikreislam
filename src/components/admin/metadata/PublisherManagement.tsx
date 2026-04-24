import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, Check, X, Building2 } from 'lucide-react';
import { getPublishers, createPublisher, updatePublisher, deletePublisher } from '@/actions/bookMetadata';

interface Publisher {
    id: string;
    name: string;
    country: string;
}

export function PublisherManagement() {
    const [publishers, setPublishers] = useState<Publisher[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newCountry, setNewCountry] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCountry, setEditCountry] = useState('');

    useEffect(() => {
        fetchPublishers();
    }, []);

    const fetchPublishers = async () => {
        try {
            setLoading(true);
            const { data, error } = await getPublishers();
            if (error) throw error;
            setPublishers((data as Publisher[]) || []);
        } catch (error: any) {
            console.error('Error fetching publishers:', error);
            toast.error("ایک غلطی واقع ہوئی ہے");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setActionLoading('add');
        try {
            const exists = publishers.some(p => p.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) throw new Error("یہ نام پہلے سے موجود ہے");

            const { error } = await createPublisher({ name: newName.trim(), country: newCountry.trim() || undefined });
            if (error) throw error;

            toast.success("کامیاب");
            setNewName(''); setNewCountry('');
            fetchPublishers();
        } catch (error: any) {
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim()) return;

        setActionLoading(id);
        try {
            const exists = publishers.some(p => p.id !== id && p.name.toLowerCase() === editName.trim().toLowerCase());
            if (exists) throw new Error("یہ نام پہلے سے موجود ہے");

            const { error } = await updatePublisher(id, { name: editName.trim(), country: editCountry.trim() || undefined });
            if (error) throw error;

            toast.success("کامیاب");
            setEditingId(null);
            fetchPublishers();
        } catch (error: any) {
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`کیا آپ واقعی "${name}" کو حذف کرنا چاہتے ہیں؟`)) return;

        setActionLoading(id);
        try {
            const { error } = await deletePublisher(id);
            if (error) throw error;

            toast.success("کامیاب");
            setPublishers(prev => prev.filter(p => p.id !== id));
        } catch (error: any) {
            toast.error("ایک غلطی واقع ہوئی ہے");
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
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle>{"ناشرین"}</CardTitle>
                    <CardDescription>{"نئے ناشرین شامل کریں، ان کے نام تبدیل کریں یا انہیں حذف کریں۔"}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAdd} className="flex gap-3 items-end mb-8">
                    <div className="space-y-2 flex-1">
                        <Label>{"نام"} <span className="text-destructive">*</span></Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ناشر کا نام درج کریں..." required />
                    </div>
                    <div className="space-y-2 flex-1">
                        <Label>{"ملک"}</Label>
                        <Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="مثلاً پاکستان" />
                    </div>
                    <Button type="submit" disabled={actionLoading === 'add'}>
                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {"شامل کریں"}</>}
                    </Button>
                </form>

                <div className="grid gap-2">
                    {publishers.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/20 border rounded-md group gap-3">
                            {editingId === item.id ? (
                                <div className="flex-1 flex gap-2 items-center">
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" autoFocus placeholder="نام" />
                                    <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="h-8" placeholder="ملک" />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleEdit(item.id)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="min-w-0">
                                        <span className="font-medium">{item.name}</span>
                                        {item.country && <span className="text-xs text-muted-foreground mr-2"> • {item.country}</span>}
                                    </div>
                                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                            setEditingId(item.id); setEditName(item.name); setEditCountry(item.country);
                                        }}>
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
                    {publishers.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground italic">
                            {"کوئی ناشر نہیں ملا۔"}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
