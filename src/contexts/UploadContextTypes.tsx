import { createContext, useContext } from 'react';

export type UploadStatus = 'preparing' | 'uploading' | 'database' | 'completed' | 'error' | 'interrupted' | 'deleting' | 'cancelled';

export interface ActiveUpload {
    id: string;
    fileName: string;
    title: string;
    progress: number;
    status: UploadStatus;
    error?: string;
    startTime: number;
    type?: 'upload' | 'edit' | 'delete';
}

export interface UploadContextType {
    activeUploads: ActiveUpload[];
    uploadContent: (formData: any, mainFile: File, coverFile: File | null) => Promise<void>;
    editContent: (contentId: string, currentStatus: string, updatePayload: any, newMainFile: File | null, newCoverFile: File | null, contentTitle: string, currentFileUrl: string | null, contentType: string) => Promise<void>;
    deleteContent: (id: string, title: string, fileUrl: string | null, coverImageUrl: string | null) => Promise<void>;
    cancelUpload: (id: string) => void;
    clearCompleted: () => void;
}

export const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error('useUpload must be used within an UploadProvider');
    }
    return context;
};
