import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createAuthor, createPublisher } from '@/actions/bookMetadata';
import { createLanguage, createCategory } from '@/actions/metadata';

export type MetadataType = 'author' | 'publisher' | 'language' | 'category';

interface QuickAddMetadataDialogProps {
    type: MetadataType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (data: { id: string; name: string }) => void;
    initialName?: string;
}

export function QuickAddMetadataDialog({ type, open, onOpenChange, onSuccess, initialName = '' }: QuickAddMetadataDialogProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(initialName);
    
    // Author specific
    const [deen, setDeen] = useState('');
    const [mazhab, setMazhab] = useState('');
    const [fiqh, setFiqh] = useState('');
    
    // Publisher specific
    const [country, setCountry] = useState('');

    const resetFields = () => {
        setName('');
        setDeen('');
        setMazhab('');
        setFiqh('');
        setCountry('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            let result;
            if (type === 'author') {
                result = await createAuthor({ name: name.trim(), deen: deen.trim(), mazhab: mazhab.trim(), fiqh: fiqh.trim() });
            } else if (type === 'publisher') {
                result = await createPublisher({ name: name.trim(), country: country.trim() });
            } else if (type === 'language') {
                result = await createLanguage(name.trim());
            } else if (type === 'category') {
                result = await createCategory(name.trim());
            }

            if (result?.error) throw new Error(typeof result.error === 'string' ? result.error : (result.error as any).message);
            
            if (result?.data) {
                toast.success("کامیابی سے شامل کر دیا گیا");
                onSuccess({ id: result.data.id, name: result.data.name });
                onOpenChange(false);
                resetFields();
            }
        } catch (error: any) {
            toast.error(error.message || "شامل کرنے میں ناکامی");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'author': return "نیا مصنف شامل کریں";
            case 'publisher': return "نیا ناشر شامل کریں";
            case 'language': return "نئی زبان شامل کریں";
            case 'category': return "نیا زمرہ شامل کریں";
            default: return "شامل کریں";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{"نام"} <span className="text-destructive">*</span></Label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="نام درج کریں" 
                            required 
                            autoFocus
                        />
                    </div>

                    {type === 'author' && (
                        <>
                            <div className="space-y-2">
                                <Label>{"دین"}</Label>
                                <Input value={deen} onChange={(e) => setDeen(e.target.value)} placeholder="مثلاً اسلام" />
                            </div>
                            <div className="space-y-2">
                                <Label>{"مذھب"}</Label>
                                <Input value={mazhab} onChange={(e) => setMazhab(e.target.value)} placeholder="مثلاً حنفی" />
                            </div>
                            <div className="space-y-2">
                                <Label>{"فقہ"}</Label>
                                <Input value={fiqh} onChange={(e) => setFiqh(e.target.value)} placeholder="مثلاً دیوبندی" />
                            </div>
                        </>
                    )}

                    {type === 'publisher' && (
                        <div className="space-y-2">
                            <Label>{"ملک"}</Label>
                            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="مثلاً پاکستان" />
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{"منسوخ"}</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> {"شامل کریں"}</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
