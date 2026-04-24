import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, Check, X, BookOpen } from 'lucide-react';
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from '@/actions/bookMetadata';

interface Author {
    id: string;
    name: string;
    deen: string;
    mazhab: string;
    fiqh: string;
}

export function AuthorManagement() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newDeen, setNewDeen] = useState('');
    const [newMazhab, setNewMazhab] = useState('');
    const [newFiqh, setNewFiqh] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDeen, setEditDeen] = useState('');
    const [editMazhab, setEditMazhab] = useState('');
    const [editFiqh, setEditFiqh] = useState('');

    useEffect(() => {
        fetchAuthors();
    }, []);

    const fetchAuthors = async () => {
        try {
            setLoading(true);
            const { data, error } = await getAuthors();
            if (error) throw error;
            setAuthors((data as Author[]) || []);
        } catch (error: any) {
            console.error('Error fetching authors:', error);
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
            const exists = authors.some(a => a.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) throw new Error("یہ نام پہلے سے موجود ہے");

            const { error } = await createAuthor({
                name: newName.trim(),
                deen: newDeen.trim() || undefined,
                mazhab: newMazhab.trim() || undefined,
                fiqh: newFiqh.trim() || undefined,
            });
            if (error) throw error;

            toast.success("کامیاب");
            setNewName(''); setNewDeen(''); setNewMazhab(''); setNewFiqh('');
            fetchAuthors();
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
            const exists = authors.some(a => a.id !== id && a.name.toLowerCase() === editName.trim().toLowerCase());
            if (exists) throw new Error("یہ نام پہلے سے موجود ہے");

            const { error } = await updateAuthor(id, {
                name: editName.trim(),
                deen: editDeen.trim() || undefined,
                mazhab: editMazhab.trim() || undefined,
                fiqh: editFiqh.trim() || undefined,
            });
            if (error) throw error;

            toast.success("کامیاب");
            setEditingId(null);
            fetchAuthors();
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
            const { error } = await deleteAuthor(id);
            if (error) throw error;

            toast.success("کامیاب");
            setAuthors(prev => prev.filter(a => a.id !== id));
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
                    <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle>{"مصنفین"}</CardTitle>
                    <CardDescription>{"نئے مصنفین شامل کریں، ان کے نام تبدیل کریں یا انہیں حذف کریں۔"}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAdd} className="mb-8 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>{"نام"} <span className="text-destructive">*</span></Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مصنف کا نام درج کریں..." required />
                        </div>
                        <div className="space-y-2">
                            <Label>{"دین"}</Label>
                            <Input value={newDeen} onChange={(e) => setNewDeen(e.target.value)} placeholder="مثلاً اسلام" />
                        </div>
                        <div className="space-y-2">
                            <Label>{"مذھب"}</Label>
                            <Input value={newMazhab} onChange={(e) => setNewMazhab(e.target.value)} placeholder="مثلاً حنفی" />
                        </div>
                        <div className="space-y-2">
                            <Label>{"فقہ"}</Label>
                            <Input value={newFiqh} onChange={(e) => setNewFiqh(e.target.value)} placeholder="مثلاً دیوبندی" />
                        </div>
                    </div>
                    <Button type="submit" disabled={actionLoading === 'add'}>
                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {"شامل کریں"}</>}
                    </Button>
                </form>

                <div className="grid gap-2">
                    {authors.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/20 border rounded-md group gap-3">
                            {editingId === item.id ? (
                                <div className="flex-1 space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="نام" className="h-8" autoFocus />
                                        <Input value={editDeen} onChange={(e) => setEditDeen(e.target.value)} placeholder="دین" className="h-8" />
                                        <Input value={editMazhab} onChange={(e) => setEditMazhab(e.target.value)} placeholder="مذھب" className="h-8" />
                                        <Input value={editFiqh} onChange={(e) => setEditFiqh(e.target.value)} placeholder="فقہ" className="h-8" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleEdit(item.id)}>
                                            <Check className="h-4 w-4 mr-1" /> {"محفوظ"}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                            <X className="h-4 w-4 mr-1" /> {"منسوخ"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="min-w-0">
                                        <span className="font-medium">{item.name}</span>
                                        {(item.deen || item.mazhab || item.fiqh) && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {[item.deen, item.mazhab, item.fiqh].filter(Boolean).join(' • ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                            setEditingId(item.id);
                                            setEditName(item.name);
                                            setEditDeen(item.deen);
                                            setEditMazhab(item.mazhab);
                                            setEditFiqh(item.fiqh);
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
                    {authors.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground italic">
                            {"کوئی مصنف نہیں ملا۔"}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
