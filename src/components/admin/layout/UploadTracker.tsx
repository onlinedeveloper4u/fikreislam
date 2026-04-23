import React from 'react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    UploadCloud,
    Trash2,
    Clock,
    FileText,
    Music,
    Video,
    XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UploadTracker() {
    const { activeUploads, clearCompleted, clearAll, clearSuccess, removeUpload } = useUpload();

    if (activeUploads.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <UploadCloud className="h-12 w-12 mb-4 opacity-20" />
                    <p>کوئی فعال یا حالیہ میڈیا شامل نہیں ہو رہا</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> مکمل</Badge>;
            case 'error':
                return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertCircle className="h-3 w-3 mr-1" /> ناکام</Badge>;
            case 'uploading':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> شامل ہو رہا ہے</Badge>;
            case 'database':
                return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20"><Clock className="h-3 w-3 mr-1" /> محفوظ ہو رہا ہے</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">شامل کرنے کی صورتحال</h3>
                    <p className="text-sm text-muted-foreground">
                        اپنے پس منظر میں شامل ہونے والے میڈیا کی نگرانی کریں
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSuccess}
                        disabled={!activeUploads.some(u => u.status === 'completed')}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        صرف کامیاب صاف کریں
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                        disabled={activeUploads.length === 0}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        تمام اشیاء صاف کریں
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {activeUploads.map((upload) => (
                    <Card key={upload.id} className={cn(
                        "border-border/50 transition-all",
                        upload.status === 'error' && "border-red-500/20 bg-red-500/5",
                        upload.status === 'completed' && "border-green-500/20 bg-green-500/5"
                    )}>
                        <CardContent className="p-4 relative group">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeUpload(upload.id)}
                                title="حذف کریں"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate">{upload.title}</h4>
                                        {getStatusBadge(upload.status)}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mb-4">
                                        {upload.fileName} • {new Date(upload.startTime).toLocaleTimeString('ur-PK', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                                    </p>

                                    {upload.status !== 'completed' && upload.status !== 'error' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>پیش رفت</span>
                                                <span>{upload.progress}%</span>
                                            </div>
                                            <Progress value={upload.progress} className="h-1.5" />
                                        </div>
                                    )}

                                    {upload.status === 'error' && (
                                        <div className="flex items-start gap-2 mt-2 p-3 rounded-md bg-red-500/10 text-red-600 text-sm border border-red-500/20">
                                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium">اپ لوڈ ناکام</p>
                                                <p className="text-xs opacity-80">{upload.error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {upload.status === 'completed' && (
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            فائل کامیابی سے پراسیس ہو گئی اور لائبریری میں شامل کر دی گئی۔
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
