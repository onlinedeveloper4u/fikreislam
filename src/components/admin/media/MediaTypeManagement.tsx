import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, Check, X, LayoutGrid } from 'lucide-react';
import { getMediaTypes, createMediaType, updateMediaType, deleteMediaType, getSpeakers } from '@/actions/metadata';

interface Speaker {
    id: string;
    name: string;
}

interface MediaType {
    id: string;
    name: string;
    speaker_id: string;
    speakers: { name: string };
    updated_at: string;
}

export function MediaTypeManagement() {
    const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
    const [speakers, setSpeakers] = useState<Speaker[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newName, setNewName] = useState('');
    const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [{ data: speakersData }, { data: typesData }] = await Promise.all([
                getSpeakers(),
                getMediaTypes()
            ]);

            setSpeakers((speakersData as unknown as Speaker[]) || []);
            
            // Map the speaker name for frontend
            const speakerMap = new Map((speakersData as unknown as Speaker[] || []).map(s => [s.id, s.name]));
            const mappedTypes = ((typesData as unknown as MediaType[]) || []).map(t => ({
                ...t,
                speakers: { name: speakerMap.get(t.speaker_id) || 'نامعلوم' }
            }));
            
            setMediaTypes(mappedTypes);
            if (speakersData && speakersData.length > 0 && !selectedSpeakerId) {
                setSelectedSpeakerId((speakersData[0] as unknown as Speaker).id);
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast.error("ایک غلطی واقع ہوئی ہے");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMediaType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !selectedSpeakerId) return;

        setActionLoading('add');
        try {
            const exists = mediaTypes.some(t =>
                t.name.toLowerCase() === newName.trim().toLowerCase() &&
                t.speaker_id === selectedSpeakerId
            );
            if (exists) {
                throw new Error("یہ نام اس مقرر کے لیے پہلے سے موجود ہے");
            }

            const { error } = await createMediaType(newName.trim());
            if (error) throw error;

            toast.success("کامیاب");
            setNewName('');
            fetchData();
        } catch (error: any) {
            console.error('Add error:', error);
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = async (id: string, initialSpeakerId: string) => {
        if (!editName.trim()) return;

        setActionLoading(id);
        try {
            const exists = mediaTypes.some(t =>
                t.id !== id &&
                t.name.toLowerCase() === editName.trim().toLowerCase() &&
                t.speaker_id === initialSpeakerId
            );
            if (exists) {
                throw new Error("یہ نام اس مقرر کے لیے پہلے سے موجود ہے");
            }

            const at = mediaTypes.find(a => a.id === id);
            const speakerName = at?.speakers.name;

            const { error } = await updateMediaType(id, editName.trim(), speakerName);
            if (error) throw error;

            toast.success("کامیاب");
            setEditingId(null);
            setEditName('');
            fetchData();
        } catch (error: any) {
            console.error('Edit error:', error);
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string, speakerName: string) => {
        if (!window.confirm(`کیا آپ واقعی "${name}" (${speakerName}) کو حذف کرنا چاہتے ہیں؟`)) return;

        setActionLoading(id);
        try {
            const { error } = await deleteMediaType(id);
            if (error) throw error;

            toast.success("کامیاب");
            setMediaTypes(prev => prev.filter(t => t.id !== id));
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

    // Group media types by speaker
    const groupedTypes = mediaTypes.reduce((acc, type) => {
        const speakerName = type.speakers?.name || 'نامعلوم';
        if (!acc[speakerName]) acc[speakerName] = [];
        acc[speakerName].push(type);
        return acc;
    }, {} as Record<string, typeof mediaTypes>);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle>{"میڈیا کی اقسام"}</CardTitle>
                    <CardDescription>{"مختلف مقررین کے لیے میڈیا کی اقسام (جیسے بیان، درس، تلاوت، ویڈیو کلپ) کا نظم کریں۔"}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddMediaType} className="flex flex-col md:flex-row gap-4 items-end mb-8 border-b pb-6 border-border/50">
                    <div className="space-y-2 flex-1 w-full relative z-[51]">
                        <Label>{"مقرر"}</Label>
                        <Select value={selectedSpeakerId} onValueChange={setSelectedSpeakerId}>
                            <SelectTrigger>
                                <SelectValue placeholder={"مقرر منتخب کریں"} />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[300px] z-[100]">
                                {speakers.map((speaker) => (
                                    <SelectItem key={speaker.id} value={speaker.id}>
                                        {speaker.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1 w-full relative z-10">
                        <Label>{"قسم کا نام"}</Label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={`نئی ${"میڈیا کی قسم"} درج کریں...`}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={actionLoading === 'add' || !selectedSpeakerId} className="w-full md:w-auto mt-4 md:mt-0 relative z-10">
                        {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {"شامل کریں"}</>}
                    </Button>
                </form>

                <div className="space-y-6">
                    {Object.entries(groupedTypes).length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground italic">
                            {"کوئی قسم نہیں ملی۔"}
                        </p>
                    ) : (
                        Object.entries(groupedTypes).map(([speakerName, types]) => (
                            <div key={speakerName} className="space-y-2">
                                <h3 className="font-semibold text-lg text-primary">{speakerName}</h3>
                                <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                                    {types.map((item) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/20 border rounded-md group gap-3">
                                            {editingId === item.id ? (
                                                <div className="flex-1 flex gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8"
                                                        autoFocus
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleEdit(item.id, item.speaker_id)}>
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
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id, item.name, speakerName)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
