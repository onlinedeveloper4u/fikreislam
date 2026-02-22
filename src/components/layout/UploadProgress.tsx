import React, { useState } from 'react';
import { useUpload } from '@/contexts/UploadContextTypes';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    X,
    UploadCloud
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UploadProgress() {
    const { activeUploads, clearCompleted, cancelUpload } = useUpload();
    const [isExpanded, setIsExpanded] = useState(true);

    if (activeUploads.length === 0) return null;

    const completedCount = activeUploads.filter(u => u.status === 'completed' || u.status === 'error' || u.status === 'cancelled').length;

    return (
        <div className="fixed bottom-4 right-4 z-[100] w-80 max-w-[calc(100vw-2rem)]">
            <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <UploadCloud className="h-4 w-4 text-primary" />
                        Status {activeUploads.length > 0 && `(${activeUploads.length})`}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        {completedCount > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={clearCompleted}
                                title="Clear completed"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>

                {isExpanded && (
                    <CardContent className="p-0 max-h-64 overflow-y-auto">
                        <div className="divide-y">
                            {activeUploads.map((upload) => (
                                <div key={upload.id} className="p-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className="font-medium truncate">{upload.title}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">
                                                {upload.type || 'upload'}
                                            </span>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            {upload.status === 'completed' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (upload.status === 'error' || upload.status === 'interrupted') ? (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            ) : upload.status === 'cancelled' ? (
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    {upload.progress}%
                                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                </span>
                                            )}

                                            {(upload.status === 'uploading' || upload.status === 'preparing') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                                    onClick={() => cancelUpload(upload.id)}
                                                    title="Cancel"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {['uploading', 'preparing', 'database', 'deleting'].includes(upload.status) && (
                                        <Progress value={upload.progress} className="h-1" />
                                    )}

                                    {upload.error && (
                                        <p className="text-[10px] text-red-500 line-clamp-1">{upload.error}</p>
                                    )}

                                    <p className={cn(
                                        "text-[10px] capitalize font-medium",
                                        upload.status === 'interrupted' ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                        {upload.status === 'interrupted' ? 'Interrupted (Reload to retry)' : `${upload.status}...`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
