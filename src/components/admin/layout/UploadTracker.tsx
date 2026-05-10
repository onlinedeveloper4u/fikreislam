import React from 'react';
import { useUpload, UploadStatus } from '@/contexts/UploadContextTypes';
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
            <Card className="border-dashed border-2 bg-muted/20 hover:bg-muted/30 transition-colors cursor-default">
                <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 opacity-50 group">
                        <UploadCloud className="h-8 w-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-lg font-medium">{"کوئی فعال کام موجود نہیں ہے"}</p>
                    <p className="text-sm opacity-60 mt-1">{"جب آپ نیا میڈیا شامل کریں گے تو اس کی صورتحال یہاں دکھائی دے گی"}</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: UploadStatus, type?: string) => {
        const statusConfig: Record<UploadStatus, { label: string, className: string, icon: any }> = {
            preparing: { label: "تیاری ہو رہی ہے", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
            uploading: { label: type === 'edit' ? "تبدیلی ہو رہی ہے" : "شامل ہو رہا ہے", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Loader2 },
            database: { label: "محفوظ ہو رہا ہے", className: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Clock },
            completed: { label: "مکمل", className: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
            error: { label: "ناکام", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertCircle },
            deleting: { label: "حذف ہو رہا ہے", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: Trash2 },
            cancelled: { label: "منسوخ", className: "opacity-50", icon: XCircle },
            interrupted: { label: "منقطع", className: "text-amber-600 border-amber-200", icon: AlertCircle }
        };

        const config = statusConfig[status] || { label: status, className: "", icon: Clock };
        const Icon = config.icon;

        return (
            <Badge className={cn("flex items-center gap-1.5", config.className)} variant={status === 'cancelled' || status === 'interrupted' ? "outline" : "default"}>
                {status === 'uploading' && <Icon className="h-3 w-3 animate-spin" />}
                {status !== 'uploading' && <Icon className="h-3 w-3" />}
                {config.label}
            </Badge>
        );
    };

    const getContentTypeIcon = (contentType?: string) => {
        if (!contentType) return <UploadCloud className="h-5 w-5 text-muted-foreground" />;
        const ct = contentType.toLowerCase();
        if (ct.includes('آڈیو') || ct.includes('audio')) return <Music className="h-5 w-5 text-muted-foreground" />;
        if (ct.includes('ویڈیو') || ct.includes('video')) return <Video className="h-5 w-5 text-muted-foreground" />;
        if (ct.includes('کتاب') || ct.includes('book') || ct.includes('تصنیف')) return <FileText className="h-5 w-5 text-muted-foreground" />;
        return <UploadCloud className="h-5 w-5 text-muted-foreground" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {"اپنے پس منظر میں جاری کاموں (شامل کرنا، تبدیلی یا حذف) کی نگرانی کریں"}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSuccess}
                        disabled={!activeUploads.some(u => u.status === 'completed')}
                        className="flex-1 sm:flex-none text-[10px] sm:text-xs h-8"
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        {"صرف مکمل شدہ صاف کریں"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                        disabled={activeUploads.length === 0}
                        className="flex-1 sm:flex-none text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] sm:text-xs h-8"
                    >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        {"تمام فہرست صاف کریں"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {activeUploads.map((upload) => (
                    <Card key={upload.id} className={cn(
                        "border-border/50 transition-all shadow-sm hover:shadow-md",
                        upload.status === 'error' && "border-red-500/20 bg-red-500/5",
                        upload.status === 'completed' && "border-green-500/20 bg-green-500/5"
                    )}>
                        <CardContent className="p-4 relative group">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 left-2 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeUpload(upload.id)}
                                title="حذف کریں"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-1">
                                    {getContentTypeIcon(upload.contentType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate max-w-[200px] sm:max-w-none font-sans">{upload.title}</h4>
                                        {getStatusBadge(upload.status, upload.type)}
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate mb-3 font-sans opacity-70">
                                        {(() => {
                                            const timeStr = new Date(upload.startTime).toLocaleTimeString('ur-PK', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
                                            const typeLabel = upload.contentType || "میڈیا";
                                            return `${typeLabel} • ${timeStr}`;
                                        })()}
                                    </p>

                                    {(upload.status === 'uploading' || upload.status === 'database' || upload.status === 'preparing' || upload.status === 'deleting') && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] sm:text-xs font-medium">
                                                <span>{"پیش رفت"}</span>
                                                <span>{upload.progress}%</span>
                                            </div>
                                            <Progress value={upload.progress} className="h-1" />
                                        </div>
                                    )}

                                    {upload.status === 'error' && (
                                        <div className="flex items-start gap-2 mt-2 p-3 rounded-md bg-red-500/10 text-red-600 text-sm border border-red-500/20">
                                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium">{"عمل میں ناکامی"}</p>
                                                <p className="text-xs opacity-80">{upload.error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {upload.status === 'completed' && (
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {upload.type === 'delete' 
                                                ? "کامیابی سے حذف کر دیا گیا ہے۔" 
                                                : `${upload.contentType || 'فائل'} کامیابی سے لائبریری میں شامل کر دی گئی ہے۔`}
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
