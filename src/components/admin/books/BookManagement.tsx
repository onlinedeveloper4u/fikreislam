import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    Loader2, Search, Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp,
    Eye, Download, ExternalLink, BookCopy,
} from 'lucide-react';
import { getWorks, deleteWork, getPublicationsByWork, deletePublication } from '@/actions/books';
import { getAuthors, getPublishers } from '@/actions/bookMetadata';
import { getLanguages, getCategories } from '@/actions/metadata';
import { deleteIAItem } from '@/actions/internetArchive';
import { WorkFormDialog } from './WorkFormDialog';
import { PublicationFormDialog } from './PublicationFormDialog';

interface WorkItem {
    id: string;
    primaryTitle: string;
    titles: string[];
    type: string;
    authors: { id: string; name: string }[];
    originalLanguage: { id: string; name: string } | null;
    categories: { id: string; name: string }[];
    publicationsCount: number;
    createdAt: string | null;
}

interface PublicationItem {
    id: string;
    workId: string;
    title: string;
    isTranslation: boolean;
    translationLanguage: { id: string; name: string } | null;
    translators: { id: string; name: string }[];
    publisher: { id: string; name: string; country?: string } | null;
    edition: { number?: number; year?: number };
    totalPages?: number;
    volumes: number;
    iaIdentifiers: { volume: number; identifier: string }[];
    createdAt: string | null;
}

export function BookManagement() {
    const [works, setWorks] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [languageFilter, setLanguageFilter] = useState<string>('all');
    const [authorFilter, setAuthorFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Expanded publications per work
    const [expandedWork, setExpandedWork] = useState<string | null>(null);
    const [publications, setPublications] = useState<PublicationItem[]>([]);
    const [pubsLoading, setPubsLoading] = useState(false);

    // Dialog states
    const [workDialogOpen, setWorkDialogOpen] = useState(false);
    const [editingWork, setEditingWork] = useState<WorkItem | null>(null);

    const [pubDialogOpen, setPubDialogOpen] = useState(false);
    const [pubDialogWorkId, setPubDialogWorkId] = useState<string>('');
    const [editingPub, setEditingPub] = useState<PublicationItem | null>(null);

    // Metadata for filters
    const [allLanguages, setAllLanguages] = useState<{ id: string; name: string }[]>([]);
    const [allAuthors, setAllAuthors] = useState<{ id: string; name: string }[]>([]);
    const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        fetchWorks();
        getLanguages().then(({ data }) => {
            if (data) setAllLanguages(data.map(l => ({ id: l.id, name: l.name })));
        });
        getAuthors().then(({ data }) => {
            if (data) setAllAuthors(data.map(a => ({ id: a.id, name: a.name })));
        });
        getCategories().then(({ data }) => {
            if (data) setAllCategories(data.map(c => ({ id: c.id, name: c.name })));
        });
    }, []);

    const fetchWorks = async () => {
        try {
            setLoading(true);
            const { data, error } = await getWorks();
            if (error) throw error;
            setWorks(data || []);
        } catch (error: any) {
            toast.error("کتب لوڈ کرنے میں ناکامی");
        } finally {
            setLoading(false);
        }
    };

    const handleExpandWork = async (workId: string) => {
        if (expandedWork === workId) {
            setExpandedWork(null);
            setPublications([]);
            return;
        }
        setExpandedWork(workId);
        setPubsLoading(true);
        try {
            const { data, error } = await getPublicationsByWork(workId);
            if (error) throw error;
            setPublications(data || []);
        } catch {
            toast.error("اشاعتیں لوڈ کرنے میں ناکامی");
        } finally {
            setPubsLoading(false);
        }
    };

    const handleDeleteWork = async (work: WorkItem) => {
        try {
            // Delete IA items for all publications of this work
            const { data: pubs } = await getPublicationsByWork(work.id);
            if (pubs) {
                for (const pub of pubs) {
                    for (const ia of pub.iaIdentifiers) {
                        await deleteIAItem(ia.identifier);
                    }
                }
            }
            const { error } = await deleteWork(work.id);
            if (error) throw error;
            toast.success("تصنیف اور تمام اشاعتیں حذف ہو گئیں");
            fetchWorks();
            if (expandedWork === work.id) {
                setExpandedWork(null);
                setPublications([]);
            }
        } catch {
            toast.error("حذف کرنے میں ناکامی");
        }
    };

    const handleDeletePublication = async (pub: PublicationItem) => {
        try {
            for (const ia of pub.iaIdentifiers) {
                await deleteIAItem(ia.identifier);
            }
            const { error } = await deletePublication(pub.id);
            if (error) throw error;
            toast.success("اشاعت حذف ہو گئی");
            // Refresh publications list
            if (expandedWork) {
                handleExpandWork(expandedWork);
            }
            fetchWorks();
        } catch {
            toast.error("حذف کرنے میں ناکامی");
        }
    };

    const filteredWorks = works.filter(w => {
        const matchesSearch = !searchQuery ||
            w.primaryTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.titles.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'all' || w.type === typeFilter;
        const matchesLanguage = languageFilter === 'all' || w.originalLanguage?.id === languageFilter;
        const matchesAuthor = authorFilter === 'all' || w.authors.some(a => a.id === authorFilter);
        const matchesCategory = categoryFilter === 'all' || w.categories.some(c => c.id === categoryFilter);
        return matchesSearch && matchesType && matchesLanguage && matchesAuthor && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-semibold">{"کتب کا انتظام"}</h2>
                <Button className="gradient-primary" onClick={() => { setEditingWork(null); setWorkDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> {"نئی تصنیف شامل کریں"}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={"عنوان سے تلاش کریں..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder={"قسم"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{"تمام اقسام"}</SelectItem>
                        <SelectItem value="book">{"کتاب"}</SelectItem>
                        <SelectItem value="article">{"مقالہ"}</SelectItem>
                        <SelectItem value="fatwa">{"فتویٰ"}</SelectItem>
                        <SelectItem value="other">{"دیگر"}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder={"زبان"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{"تمام زبانیں"}</SelectItem>
                        {allLanguages.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder={"مصنف"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{"تمام مصنفین"}</SelectItem>
                        {allAuthors.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder={"زمرہ"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{"تمام زمرہ جات"}</SelectItem>
                        {allCategories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <p className="text-sm text-muted-foreground">
                {`${works.length} میں سے ${filteredWorks.length} تصانیف دکھائی جا رہی ہیں`}
            </p>

            {/* Works List */}
            <div className="space-y-3">
                {filteredWorks.map((work) => (
                    <div key={work.id}>
                        <Card className="border-border/50 bg-card/50">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-foreground truncate font-sans">{work.primaryTitle}</p>
                                            <p className="text-xs text-muted-foreground truncate font-sans">
                                                {work.authors.map(a => a.name).join('، ') || 'نامعلوم مصنف'}
                                                {' • '}
                                                {work.originalLanguage?.name || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-end sm:self-auto border-t sm:border-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                                            {work.type === 'book' ? 'کتاب' : work.type === 'article' ? 'مقالہ' : work.type === 'fatwa' ? 'فتویٰ' : 'دیگر'}
                                        </Badge>
                                        <Badge className="bg-primary/10 text-primary text-[10px] sm:text-xs">
                                            <BookCopy className="h-3 w-3 ml-1" />
                                            {work.publicationsCount} {"اشاعت"}
                                        </Badge>

                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="اشاعتیں دیکھیں" onClick={() => handleExpandWork(work.id)}>
                                            {expandedWork === work.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>

                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="ترمیم" onClick={() => { setEditingWork(work); setWorkDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="حذف کریں">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{"تصنیف حذف کریں"}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {`کیا آپ واقعی "${work.primaryTitle}" کو حذف کرنا چاہتے ہیں؟ اس سے تمام ${work.publicationsCount} اشاعتیں بھی حذف ہو جائیں گی۔`}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{"منسوخ"}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteWork(work)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        {"حذف کریں"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>

                                {/* Expanded Publications Sub-list */}
                                {expandedWork === work.id && (
                                    <div className="mt-4 border-t pt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-muted-foreground">{"اشاعتیں"}</h4>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setPubDialogWorkId(work.id);
                                                setEditingPub(null);
                                                setPubDialogOpen(true);
                                            }}>
                                                <Plus className="h-3 w-3 mr-1" /> {"نئی اشاعت"}
                                            </Button>
                                        </div>

                                        {pubsLoading ? (
                                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                                        ) : publications.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">{"کوئی اشاعت نہیں ملی"}</p>
                                        ) : (
                                            publications.map((pub) => (
                                                <div key={pub.id} className="p-3 bg-muted/10 border rounded-md space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-sm truncate">{pub.title}</p>
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                {pub.isTranslation && (
                                                                    <Badge variant="secondary" className="text-[10px]">
                                                                        {"ترجمہ"} — {pub.translationLanguage?.name}
                                                                    </Badge>
                                                                )}
                                                                {pub.publisher && (
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {pub.publisher.name}
                                                                    </Badge>
                                                                )}
                                                                {pub.edition?.number && (
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {"طبع"} {pub.edition.number}
                                                                    </Badge>
                                                                )}
                                                                {pub.edition?.year && (
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {pub.edition.year}
                                                                    </Badge>
                                                                )}
                                                                {pub.totalPages && (
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {pub.totalPages} {"صفحات"}
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    {pub.volumes} {"جلد"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" title="ترمیم" onClick={() => {
                                                                setPubDialogWorkId(work.id);
                                                                setEditingPub(pub);
                                                                setPubDialogOpen(true);
                                                            }}>
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف کریں">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>{"اشاعت حذف کریں"}</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            {`کیا آپ واقعی "${pub.title}" کو حذف کرنا چاہتے ہیں؟`}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>{"منسوخ"}</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeletePublication(pub)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                            {"حذف کریں"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>

                                                    {/* Volume IA Links */}
                                                    {pub.iaIdentifiers.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {pub.iaIdentifiers.map((ia) => (
                                                                <div key={ia.volume} className="flex flex-col sm:flex-row sm:items-center gap-1 bg-background/80 border rounded px-2 py-1.5 sm:py-1 text-[10px] sm:text-xs w-full sm:w-auto">
                                                                    <span className="font-medium">{"جلد"} {ia.volume}:</span>
                                                                    <div className="flex gap-2">
                                                                        <a href={`https://archive.org/details/${ia.identifier}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                                                                            <Eye className="h-3 w-3" /> {"پڑھیں"}
                                                                        </a>
                                                                        <a href={`https://archive.org/download/${ia.identifier}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                                                                            <Download className="h-3 w-3" /> {"ڈاؤنلوڈ"}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ))}

                {filteredWorks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>{"کوئی تصنیف نہیں ملی"}</p>
                    </div>
                )}
            </div>

            {/* Work Form Dialog */}
            <WorkFormDialog
                open={workDialogOpen}
                onOpenChange={(open) => { setWorkDialogOpen(open); if (!open) setEditingWork(null); }}
                editingWork={editingWork}
                onSuccess={(newWorkId) => {
                    setWorkDialogOpen(false);
                    setEditingWork(null);
                    fetchWorks();
                    if (newWorkId) {
                        // Trigger Step 2
                        setPubDialogWorkId(newWorkId);
                        setEditingPub(null);
                        setPubDialogOpen(true);
                    }
                }}
            />

            {/* Publication Form Dialog */}
            <PublicationFormDialog
                open={pubDialogOpen}
                onOpenChange={(open) => { setPubDialogOpen(open); if (!open) setEditingPub(null); }}
                workId={pubDialogWorkId}
                editingPub={editingPub}
                onSuccess={() => {
                    setPubDialogOpen(false);
                    setEditingPub(null);
                    if (expandedWork) handleExpandWork(expandedWork);
                    fetchWorks();
                }}
            />
        </div>
    );
}
