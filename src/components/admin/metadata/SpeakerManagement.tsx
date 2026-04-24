import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, Check, X, User } from 'lucide-react';
import { getSpeakers, createSpeaker, updateSpeaker, deleteSpeaker } from '@/actions/metadata';

interface Speaker {
    id: string;
    name: string;
    updated_at: string;
}

export function SpeakerManagement() {
    const [speakers, setSpeakers] = useState<Speaker[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchSpeakers();
    }, []);

    const fetchSpeakers = async () => {
        try {
            setLoading(true);
            const { data, error } = await getSpeakers();
            if (error) throw error;
            setSpeakers((data as unknown as Speaker[]) || []);
        } catch (error: any) {
            console.error('Error fetching speakers:', error);
            toast.error("ایک غلطی واقع ہوئی ہے");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSpeaker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setActionLoading('add');
        try {
            const exists = speakers.some(s => s.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) {
                throw new Error("یہ نام پہلے سے موجود ہے");
            }

            const { error } = await createSpeaker(newName.trim());
            if (error) throw error;

            toast.success("کامیاب");
            setNewName('');
            fetchSpeakers();
        } catch (error: any) {
            console.error('Add error:', error);
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim()) return;

        setActionLoading(id);
        try {
            const exists = speakers.some(s => s.id !== id && s.name.toLowerCase() === editName.trim().toLowerCase());
            if (exists) {
                throw new Error("یہ نام پہلے سے موجود ہے");
            }

            const { error } = await updateSpeaker(id, editName.trim());
            if (error) throw error;

            toast.success("کامیاب");
            setEditingId(null);
            setEditName('');
            fetchSpeakers();
        } catch (error: any) {
            console.error('Edit error:', error);
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`کیا آپ واقعی "${name}" کو حذف کرنا چاہتے ہیں؟`)) return;

        setActionLoading(id);
        try {
            const { error } = await deleteSpeaker(id);
            if (error) throw error;

            toast.success("کامیاب");
            setSpeakers(prev => prev.filter(s => s.id !== id));
        } catch (error: any) {
            console.error('Delete error:', error);
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
                    <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle>{"مقررین"}</CardTitle>
                    <CardDescription>{"نئے مقررین شامل کریں، ان کے نام تبدیل کریں یا انہیں حذف کریں۔"}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddSpeaker} className="flex gap-4 items-end mb-8">
                    <div className="space-y-2 flex-1">
                        <Label>{"نام"}</Label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={`نیا ${"مقرر"} کا نام درج کریں...`}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={actionLoading === 'add'}>
                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {"شامل کریں"}</>}
                    </Button>
                </form>

                <div className="grid gap-2">
                    {speakers.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/20 border rounded-md group gap-3">
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
                                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                    {speakers.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground italic">
                            {`کوئی ${"مقرر"} نہیں ملا۔`}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
