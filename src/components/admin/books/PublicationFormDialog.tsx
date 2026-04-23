import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Save, X, Upload, FileText, CheckCircle, Plus } from 'lucide-react';
import { MetadataCombobox } from '../shared/MetadataCombobox';
import { getAuthors, getPublishers } from '@/actions/bookMetadata';
import { getLanguages } from '@/actions/metadata';
import { createPublication, updatePublication } from '@/actions/books';
import { QuickAddMetadataDialog, MetadataType } from '../shared/QuickAddMetadataDialog';
import { createAuthor, createPublisher } from '@/actions/bookMetadata';
import { createLanguage } from '@/actions/metadata';
import { formatBytes } from '@/lib/utils';

interface PublicationFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workId: string;
    editingPub: any | null;
    onSuccess: () => void;
}

export function PublicationFormDialog({ open, onOpenChange, workId, editingPub, onSuccess }: PublicationFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<number, 'idle' | 'uploading' | 'done' | 'error'>>({});

    // Form fields
    const [title, setTitle] = useState('');
    const [isTranslation, setIsTranslation] = useState(false);
    const [selectedTranslationLang, setSelectedTranslationLang] = useState<{ id: string; name: string } | null>(null);
    const [selectedTranslators, setSelectedTranslators] = useState<{ id: string; name: string }[]>([]);
    const [selectedPublisher, setSelectedPublisher] = useState<{ id: string; name: string } | null>(null);
    const [editionNumber, setEditionNumber] = useState('');
    const [editionYear, setEditionYear] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [volumes, setVolumes] = useState(1);
    const [volumeFiles, setVolumeFiles] = useState<(File | null)[]>([null]);
    const [iaIdentifiers, setIaIdentifiers] = useState<{ volume: number; identifier: string }[]>([]);

    // Quick Add state
    const [quickAddType, setQuickAddType] = useState<MetadataType | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddInitialName, setQuickAddInitialName] = useState('');

    // Metadata options
    const [authorOptions, setAuthorOptions] = useState<{ id: string; name: string }[]>([]);
    const [languageOptions, setLanguageOptions] = useState<{ id: string; name: string }[]>([]);
    const [publisherOptions, setPublisherOptions] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (open) {
            fetchMetadata();
        }
    }, [open]);

    useEffect(() => {
        if (editingPub) {
            setTitle(editingPub.title || '');
            setIsTranslation(editingPub.isTranslation || false);
            setSelectedTranslationLang(editingPub.translationLanguage || null);
            setSelectedTranslators(editingPub.translators || []);
            setSelectedPublisher(editingPub.publisher || null);
            setEditionNumber(editingPub.edition?.number?.toString() || '');
            setEditionYear(editingPub.edition?.year?.toString() || '');
            setTotalPages(editingPub.totalPages?.toString() || '');
            setVolumes(editingPub.volumes || 1);
            setIaIdentifiers(editingPub.iaIdentifiers || []);
            setVolumeFiles(Array(editingPub.volumes || 1).fill(null));
        } else {
            resetForm();
        }
    }, [editingPub, open]);

    const resetForm = () => {
        setTitle('');
        setIsTranslation(false);
        setSelectedTranslationLang(null);
        setSelectedTranslators([]);
        setSelectedPublisher(null);
        setEditionNumber('');
        setEditionYear('');
        setTotalPages('');
        setVolumes(1);
        setVolumeFiles([null]);
        setIaIdentifiers([]);
        setUploadProgress({});
    };

    const fetchMetadata = async () => {
        const [{ data: authors }, { data: languages }, { data: publishers }] = await Promise.all([
            getAuthors(),
            getLanguages(),
            getPublishers(),
        ]);
        setAuthorOptions((authors || []).map(a => a.name ? { id: a.id, name: a.name } : null).filter(Boolean) as any);
        setLanguageOptions((languages || []).map(l => l.name ? { id: l.id, name: l.name } : null).filter(Boolean) as any);
        setPublisherOptions((publishers || []).map(p => p.name ? { id: p.id, name: p.name } : null).filter(Boolean) as any);
    };

    const handleVolumesChange = (newCount: number) => {
        const count = Math.max(1, Math.min(50, newCount));
        setVolumes(count);
        setVolumeFiles(prev => {
            const arr = [...prev];
            while (arr.length < count) arr.push(null);
            return arr.slice(0, count);
        });
    };

    const handleFileChange = (index: number, file: File | null) => {
        setVolumeFiles(prev => {
            const arr = [...prev];
            arr[index] = file;
            return arr;
        });
    };

    const handleTranslatorSelect = (value: string) => {
        const existing = authorOptions.find(a => a.name === value);
        if (existing) {
            if (!selectedTranslators.find(t => t.id === existing.id)) {
                setSelectedTranslators([...selectedTranslators, existing]);
            }
        } else {
            setQuickAddType('author');
            setQuickAddInitialName(value);
            setQuickAddOpen(true);
        }
    };

    const handleTranslationLangSelect = (value: string) => {
        const existing = languageOptions.find(l => l.name === value);
        if (existing) {
            setSelectedTranslationLang(existing);
        } else {
            setQuickAddType('language');
            setQuickAddInitialName(value);
            setQuickAddOpen(true);
        }
    };

    const handlePublisherSelect = (value: string) => {
        const existing = publisherOptions.find(p => p.name === value);
        if (existing) {
            setSelectedPublisher(existing);
        } else {
            setQuickAddType('publisher');
            setQuickAddInitialName(value);
            setQuickAddOpen(true);
        }
    };

    const handleQuickAddSuccess = (data: { id: string; name: string }) => {
        if (quickAddType === 'author') {
            setAuthorOptions(prev => [...prev, data]);
            setSelectedTranslators(prev => [...prev, data]);
        } else if (quickAddType === 'language') {
            setLanguageOptions(prev => [...prev, data]);
            setSelectedTranslationLang(data);
        } else if (quickAddType === 'publisher') {
            setPublisherOptions(prev => [...prev, data]);
            setSelectedPublisher(data);
        }
    };

    const uploadFileToIA = async (file: File, volumeNum: number): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify({
            title: `${title} - Vol ${volumeNum}`,
            contentType: 'book',
        }));

        const res = await fetch('/api/ia/upload', { method: 'POST', body: formData });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(err.error || `Upload failed for volume ${volumeNum}`);
        }
        const result = await res.json();
        return result.identifier;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) { toast.error("عنوان ضروری ہے"); return; }
        if (isTranslation && !selectedTranslationLang) { toast.error("ترجمے کی زبان ضروری ہے"); return; }
        if (isTranslation && selectedTranslators.length === 0) { toast.error("مترجم ضروری ہے"); return; }

        // Check if we need to upload any new files
        const hasNewFiles = volumeFiles.some(f => f !== null);
        if (!editingPub && !hasNewFiles) {
            toast.error("کم از کم ایک جلد کی فائل ضروری ہے");
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload files to IA first
            const updatedIdentifiers = [...iaIdentifiers];

            for (let i = 0; i < volumes; i++) {
                const file = volumeFiles[i];
                if (file) {
                    const volNum = i + 1;
                    setUploadProgress(prev => ({ ...prev, [volNum]: 'uploading' }));
                    try {
                        const identifier = await uploadFileToIA(file, volNum);
                        // Update or add identifier for this volume
                        const existingIdx = updatedIdentifiers.findIndex(ia => ia.volume === volNum);
                        if (existingIdx >= 0) {
                            updatedIdentifiers[existingIdx] = { volume: volNum, identifier };
                        } else {
                            updatedIdentifiers.push({ volume: volNum, identifier });
                        }
                        setUploadProgress(prev => ({ ...prev, [volNum]: 'done' }));
                    } catch (err: any) {
                        setUploadProgress(prev => ({ ...prev, [volNum]: 'error' }));
                        toast.error(`جلد ${volNum}: ${err.message}`);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            const payload = {
                workId,
                title: title.trim(),
                isTranslation,
                translationLanguage: isTranslation ? selectedTranslationLang?.id : undefined,
                translators: isTranslation ? selectedTranslators.map(t => t.id) : undefined,
                publisher: selectedPublisher?.id || undefined,
                edition: {
                    number: editionNumber ? parseInt(editionNumber) : undefined,
                    year: editionYear ? parseInt(editionYear) : undefined,
                },
                totalPages: totalPages ? parseInt(totalPages) : undefined,
                volumes,
                iaIdentifiers: updatedIdentifiers,
            };

            if (editingPub) {
                const { error } = await updatePublication(editingPub.id, payload);
                if (error) throw new Error(error);
                toast.success("اشاعت کامیابی سے تبدیل ہو گئی");
            } else {
                const { error } = await createPublication(payload);
                if (error) throw new Error(error);
                toast.success("اشاعت کامیابی سے شامل ہو گئی");
            }

            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "ایک غلطی واقع ہوئی ہے");
        } finally {
            setIsSubmitting(false);
            setUploadProgress({});
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingPub ? "اشاعت میں ترمیم کریں" : "نئی اشاعت شامل کریں"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label>{"عنوان"} <span className="text-destructive">*</span></Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="اشاعت کا عنوان"
                            required
                            className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all"
                        />
                    </div>

                    {/* Translation Toggle */}
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
                        <Switch checked={isTranslation} onCheckedChange={setIsTranslation} id="translation-toggle" />
                        <Label htmlFor="translation-toggle" className="cursor-pointer">{"یہ ترجمہ ہے"}</Label>
                    </div>

                    {/* Conditional: Translation Language & Translators */}
                    {isTranslation && (
                        <div className="space-y-4 p-4 bg-muted/10 border rounded-lg">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>{"ترجمے کی زبان"} <span className="text-destructive">*</span></Label>
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
                                    value={selectedTranslationLang?.name || ''}
                                    onChange={handleTranslationLangSelect}
                                    placeholder="زبان منتخب کریں"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>{"مترجمین"} <span className="text-destructive">*</span></Label>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 text-[10px] text-primary"
                                        onClick={() => { setQuickAddType('author'); setQuickAddInitialName(''); setQuickAddOpen(true); }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> {"نیا مترجم"}
                                    </Button>
                                </div>
                                <MetadataCombobox
                                    options={authorOptions.map(a => a.name)}
                                    value=""
                                    onChange={handleTranslatorSelect}
                                    placeholder="مترجم تلاش کریں یا شامل کریں"
                                />
                                {selectedTranslators.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {selectedTranslators.map((t) => (
                                            <Badge key={t.id} variant="secondary" className="text-xs py-1 px-2 gap-1">
                                                {t.name}
                                                <button type="button" onClick={() => setSelectedTranslators(prev => prev.filter(x => x.id !== t.id))} className="hover:text-destructive">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Publisher */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>{"ناشر"}</Label>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-primary"
                                onClick={() => { setQuickAddType('publisher'); setQuickAddInitialName(''); setQuickAddOpen(true); }}
                            >
                                <Plus className="h-3 w-3 mr-1" /> {"نیا ناشر"}
                            </Button>
                        </div>
                        <MetadataCombobox
                            options={publisherOptions.map(p => p.name)}
                            value={selectedPublisher?.name || ''}
                            onChange={handlePublisherSelect}
                            placeholder="ناشر تلاش کریں یا شامل کریں"
                        />
                    </div>

                    {/* Edition & Pages */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>{"طبع نمبر"}</Label>
                            <Input
                                type="number"
                                value={editionNumber}
                                onChange={(e) => setEditionNumber(e.target.value)}
                                placeholder="مثلاً 1"
                                className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{"سنِ اشاعت"}</Label>
                            <Input
                                type="number"
                                value={editionYear}
                                onChange={(e) => setEditionYear(e.target.value)}
                                placeholder="مثلاً 2024"
                                className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{"کل صفحات"}</Label>
                            <Input
                                type="number"
                                value={totalPages}
                                onChange={(e) => setTotalPages(e.target.value)}
                                placeholder="مثلاً 320"
                                className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all"
                            />
                        </div>
                    </div>

                    {/* Volumes */}
                    <div className="space-y-2">
                        <Label>{"تعداد جلد"} <span className="text-destructive">*</span></Label>
                        <Input
                            type="number"
                            min={1}
                            max={50}
                            value={volumes}
                            onChange={(e) => handleVolumesChange(parseInt(e.target.value) || 1)}
                            className="h-12 bg-background/50 border-border/40 hover:bg-background/80 transition-all w-32"
                        />
                    </div>

                    {/* Dynamic File Upload Inputs per Volume */}
                    <div className="space-y-3">
                        <Label>{"جلدوں کی فائلیں"}</Label>
                        {Array.from({ length: volumes }, (_, i) => {
                            const volNum = i + 1;
                            const existingIA = iaIdentifiers.find(ia => ia.volume === volNum);
                            const file = volumeFiles[i];
                            const status = uploadProgress[volNum];

                            return (
                                <div key={volNum} className="border rounded-lg p-3 bg-muted/10">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium shrink-0">
                                            {"جلد"} {volNum}
                                        </span>

                                        <div className="flex-1">
                                            {existingIA && !file && (
                                                <div className="flex items-center gap-2 text-xs text-green-600">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    <span className="truncate">{existingIA.identifier}</span>
                                                    <a href={`https://archive.org/details/${existingIA.identifier}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        {"دیکھیں"}
                                                    </a>
                                                </div>
                                            )}

                                            <div className="mt-1">
                                                <input
                                                    id={`vol-file-${volNum}`}
                                                    type="file"
                                                    accept=".pdf,.epub,.doc,.docx"
                                                    onChange={(e) => handleFileChange(i, e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor={`vol-file-${volNum}`}
                                                    className="cursor-pointer inline-flex items-center gap-2 text-xs border border-dashed rounded px-3 py-2 hover:border-primary/50 transition-colors"
                                                >
                                                    {status === 'uploading' ? (
                                                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {"اپلوڈ ہو رہا ہے..."}</>
                                                    ) : status === 'done' ? (
                                                        <><CheckCircle className="h-3.5 w-3.5 text-green-600" /> {"اپلوڈ مکمل"}</>
                                                    ) : file ? (
                                                        <>
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span className="max-w-[200px] truncate">{file.name}</span>
                                                            <span className="text-muted-foreground">
                                                                ({formatBytes(file.size, { bytes: "B", kb: "KB", mb: "MB", gb: "GB" })})
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <><Upload className="h-3.5 w-3.5" /> {existingIA ? "فائل تبدیل کریں" : "فائل منتخب کریں"}</>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSubmitting}>
                            {"منسوخ"}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {"محفوظ ہو رہا ہے..."}</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> {"محفوظ کریں"}</>
                            )}
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
