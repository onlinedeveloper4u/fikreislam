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
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function UploadTracker() {
    const { activeUploads, clearCompleted } = useUpload();
    const { t } = useTranslation();

    if (activeUploads.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <UploadCloud className="h-12 w-12 mb-4 opacity-20" />
                    <p>{t('dashboard.uploads.empty', { defaultValue: 'No active or recent uploads' })}</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> {t('common.completed', { defaultValue: 'Completed' })}</Badge>;
            case 'error':
                return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertCircle className="h-3 w-3 mr-1" /> {t('common.failed', { defaultValue: 'Failed' })}</Badge>;
            case 'uploading':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> {t('dashboard.uploads.uploading', { defaultValue: 'Uploading' })}</Badge>;
            case 'database':
                return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20"><Clock className="h-3 w-3 mr-1" /> {t('dashboard.uploads.saving', { defaultValue: 'Saving' })}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">{t('dashboard.uploads.title', { defaultValue: 'Upload Tracking' })}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.uploads.desc', { defaultValue: 'Monitor the status of your background uploads' })}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompleted}
                    disabled={!activeUploads.some(u => u.status === 'completed' || u.status === 'error')}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('dashboard.uploads.clear', { defaultValue: 'Clear Finished' })}
                </Button>
            </div>

            <div className="grid gap-4">
                {activeUploads.map((upload) => (
                    <Card key={upload.id} className={cn(
                        "border-border/50 transition-all",
                        upload.status === 'error' && "border-red-500/20 bg-red-500/5",
                        upload.status === 'completed' && "border-green-500/20 bg-green-500/5"
                    )}>
                        <CardContent className="p-4">
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
                                                <span>{t('dashboard.upload.progress', { defaultValue: 'Progress' })}</span>
                                                <span>{upload.progress}%</span>
                                            </div>
                                            <Progress value={upload.progress} className="h-1.5" />
                                        </div>
                                    )}

                                    {upload.status === 'error' && (
                                        <div className="flex items-start gap-2 mt-2 p-3 rounded-md bg-red-500/10 text-red-600 text-sm border border-red-500/20">
                                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium">{t('dashboard.upload.failedReason', { defaultValue: 'Upload Failed' })}</p>
                                                <p className="text-xs opacity-80">{upload.error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {upload.status === 'completed' && (
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t('dashboard.upload.finished', { defaultValue: 'File successfully processed and added to library.' })}
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
