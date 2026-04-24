import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Save, X, Plus } from 'lucide-react';
import { MetadataCombobox } from '../shared/MetadataCombobox';
import { getAuthors, getPublishers } from '@/actions/bookMetadata';
import { getLanguages, getCategories } from '@/actions/metadata';
import { createWork, updateWork } from '@/actions/books';
import { QuickAddMetadataDialog, MetadataType } from '../shared/QuickAddMetadataDialog';
import { createAuthor } from '@/actions/bookMetadata';
import { createLanguage, createCategory } from '@/actions/metadata';

interface WorkFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingWork: any | null;
    onSuccess: (newWorkId?: string) => void;
}

export function WorkFormDialog({ open, onOpenChange, editingWork, onSuccess }: WorkFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [primaryTitle, setPrimaryTitle] = useState('');
    const [titles, setTitles] = useState<string[]>([]);
    const [titleInput, setTitleInput] = useState('');
    const [type, setType] = useState('book');
    const [selectedAuthors, setSelectedAuthors] = useState<{ id: string; name: string }[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<{ id: string; name: string } | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<{ id: string; name: string }[]>([]);

    // Quick Add state
    const [quickAddType, setQuickAddType] = useState<MetadataType | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddInitialName, setQuickAddInitialName] = useState('');

    // Metadata options
    const [authorOptions, setAuthorOptions] = useState<{ id: string; name: string }[]>([]);
    const [languageOptions, setLanguageOptions] = useState<{ id: string; name: string }[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (open) {
            fetchMetadata();
        }
    }, [open]);

    useEffect(() => {
        if (editingWork) {
            setPrimaryTitle(editingWork.primaryTitle || '');
            setTitles(editingWork.titles || []);
            setType(editingWork.type || 'book');
            setSelectedAuthors(editingWork.authors || []);
            setSelectedLanguage(editingWork.originalLanguage || null);
            setSelectedCategories(editingWork.categories || []);
        } else {
            resetForm();
        }
    }, [editingWork, open]);

    const resetForm = () => {
        setPrimaryTitle('');
        setTitles([]);
        setTitleInput('');
        setType('book');
        setSelectedAuthors([]);
        setSelectedLanguage(null);
        setSelectedCategories([]);
    };

    const fetchMetadata = async () => {
        const [{ data: authors }, { data: languages }, { data: categories }] = await Promise.all([
            getAuthors(),
            getLanguages(),
            getCategories(),
        ]);
        setAuthorOptions((authors || []).map(a => a.name ? { id: a.id, name: a.name } : null).filter(Boolean) as any);
        setLanguageOptions((languages || []).map(l => l.name ? { id: l.id, name: l.name } : null).filter(Boolean) as any);
        setCategoryOptions((categories || []).map(c => c.name ? { id: c.id, name: c.name } : null).filter(Boolean) as any);
    };

    const handleAddTitle = () => {
        const val = titleInput.trim();
        if (val && !titles.includes(val)) {
            setTitles([...titles, val]);
        }
        setTitleInput('');
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTitle();
        }
    };

    const handleRemoveTitle = (t: string) => {
        setTitles(titles.filter(x => x !== t));
    };

    // Multi-select author handling via combobox
    const handleAuthorSelect = (value: string) => {
        const existing = authorOptions.find(a => a.name === value);
        if (existing) {
            if (!selectedAuthors.find(a => a.id === existing.id)) {
                setSelectedAuthors([...selectedAuthors, existing]);
            }
        } else {
            setQuickAddType('author');
            setQuickAddInitialName(value);
            setQuickAddOpen(true);
        }
    };

    const handleLanguageSelect = (value: string) => {
        const existing = languageOptions.find(l => l.name === value);
        if (existing) {
            setSelectedLanguage(existing);
        } else {
            setQuickAddType('language');
            setQuickAddInitialName(value);
            setQuickAddOpen(true);
        }
    };

    const handleCategorySelect = (value: string) => {
        const existing = categoryOptions.find(c => c.name === value);
        if (existing) {
            if (!selectedCategories.find(c => c.id === existing.id)) {
                setSelectedCategories([...selectedCategories, existing]);
            }
        } else {
            setQuickAddType('category');
            setQuickAddInitialName(value);
            setQuickAddOpen(true);
        }
    };

    const handleQuickAddSuccess = (data: { id: string; name: string }) => {
        if (quickAddType === 'author') {
            setAuthorOptions(prev => [...prev, data]);
            setSelectedAuthors(prev => [...prev, data]);
        } else if (quickAddType === 'language') {
            setLanguageOptions(prev => [...prev, data]);
            setSelectedLanguage(data);
        } else if (quickAddType === 'category') {
            setCategoryOptions(prev => [...prev, data]);
            setSelectedCategories(prev => [...prev, data]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!primaryTitle.trim()) { toast.error("بنیادی عنوان ضروری ہے"); return; }
        if (selectedAuthors.length === 0) { toast.error("کم از کم ایک مصنف ضروری ہے"); return; }
        if (!selectedLanguage) { toast.error("اصل زبان ضروری ہے"); return; }

        setIsSubmitting(true);
        try {
            const payload = {
                primaryTitle: primaryTitle.trim(),
                titles: [primaryTitle.trim(), ...titles.filter(t => t !== primaryTitle.trim())],
                type,
                authors: selectedAuthors.map(a => a.id),
                originalLanguage: selectedLanguage.id,
                categories: selectedCategories.map(c => c.id),
            };

            if (editingWork) {
                const { error } = await updateWork(editingWork.id, payload);
                if (error) throw new Error(error);
                toast.success("تصنیف کامیابی سے تبدیل ہو گئی");
                onSuccess();
            } else {
                const { data, error } = await createWork(payload);
                if (error) throw new Error(error);
                toast.success("تصنیف کامیابی سے شامل ہو گئی");
                onSuccess(data?.id);
            }
        } catch (error: any) {
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingWork ? "تصنیف میں ترمیم کریں" : "نئی تصنیف شامل کریں"}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {"تصنیف کی معلومات درج کرنے کے لیے فارم استعمال کریں"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Primary Title */}
                    <div className="space-y-2">
                        <Label>{"بنیادی عنوان"} <span className="text-destructive">*</span></Label>
                        <Input
                            value={primaryTitle}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                            placeholder="بنیادی عنوان درج کریں"
                            required
                            className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all"
                        />
                    </div>

                    {/* Titles (tag/chip input) */}
                    <div className="space-y-2">
                        <Label>{"دیگر معروف نام"}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onKeyDown={handleTitleKeyDown}
                                placeholder="نام درج کر کے Enter دبائیں"
                                className="h-10 bg-background/50 border-border/40 hover:bg-background/80 transition-all flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={handleAddTitle} className="h-10">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {titles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {titles.map((t) => (
                                    <Badge key={t} variant="secondary" className="text-xs py-1 px-2 gap-1">
                                        {t}
                                        <button type="button" onClick={() => handleRemoveTitle(t)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label>{"قسم"} <span className="text-destructive">*</span></Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="book">{"کتاب"}</SelectItem>
                                <SelectItem value="article">{"مقالہ"}</SelectItem>
                                <SelectItem value="fatwa">{"فتویٰ"}</SelectItem>
                                <SelectItem value="other">{"دیگر"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Authors - Multi-select */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>{"مصنفین"} <span className="text-destructive">*</span></Label>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-primary"
                                onClick={() => { setQuickAddType('author'); setQuickAddInitialName(''); setQuickAddOpen(true); }}
                            >
                                <Plus className="h-3 w-3 mr-1" /> {"نیا مصنف"}
                            </Button>
                        </div>
                        <MetadataCombobox
                            options={authorOptions.map(a => a.name)}
                            value=""
                            onChange={handleAuthorSelect}
                            placeholder="مصنف تلاش کریں یا شامل کریں"
                        />
                        {selectedAuthors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedAuthors.map((a) => (
                                    <Badge key={a.id} variant="secondary" className="text-xs py-1 px-2 gap-1">
                                        {a.name}
                                        <button type="button" onClick={() => setSelectedAuthors(prev => prev.filter(x => x.id !== a.id))} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Original Language */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>{"اصل زبان"} <span className="text-destructive">*</span></Label>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-primary"
                                onClick={() => { setQuickAddType('language'); setQuickAddInitialName(''); setQuickAddOpen(true); }}
                            >
                                <Plus className="h-3 w-3 mr-1" /> {"نئی زبان"}
                            </Button>
                        </div>
                        <MetadataCombobox
                            options={languageOptions.map(l => l.name)}
                            value={selectedLanguage?.name || ''}
                            onChange={handleLanguageSelect}
                            placeholder="زبان منتخب کریں"
                        />
                    </div>

                    {/* Categories - Multi-select */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>{"زمرہ جات"}</Label>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-primary"
                                onClick={() => { setQuickAddType('category'); setQuickAddInitialName(''); setQuickAddOpen(true); }}
                            >
                                <Plus className="h-3 w-3 mr-1" /> {"نیا زمرہ"}
                            </Button>
                        </div>
                        <MetadataCombobox
                            options={categoryOptions.map(c => c.name)}
                            value=""
                            onChange={handleCategorySelect}
                            placeholder="زمرہ تلاش کریں یا شامل کریں"
                        />
                        {selectedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedCategories.map((c) => (
                                    <Badge key={c.id} variant="secondary" className="text-xs py-1 px-2 gap-1">
                                        {c.name}
                                        <button type="button" onClick={() => setSelectedCategories(prev => prev.filter(x => x.id !== c.id))} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                            {"منسوخ"}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> {editingWork ? "محفوظ کریں" : "اگلا مرحلہ"}</>}
                        </Button>
                    </div>
                </form>

                <QuickAddMetadataDialog 
                    open={quickAddOpen}
                    onOpenChange={setQuickAddOpen}
                    type={quickAddType}
                    initialName={quickAddInitialName}
                    onSuccess={handleQuickAddSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}
