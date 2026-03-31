'use server'
import { 
    updateInternetArchiveMetadata as updateIAMetaLib,
    triggerIADerive as triggerIADeriveLib,
    renameInternetArchiveFile as renameIAFileLib
} from '@/lib/internetArchive';

export async function updateIAMetadata(iaUrl: string, metadata: any) {
    try {
        return { data: await updateIAMetaLib(iaUrl, metadata), error: null };
    } catch (e: any) {
        return { error: e.message || e };
    }
}

export async function renameIAFile(iaUrl: string, newTitle: string) {
    try {
        const res = await renameIAFileLib(iaUrl, newTitle);
        return { data: res, error: null };
    } catch (e: any) {
        return { error: e.message || e };
    }
}

export async function triggerIADerive(identifier: string) {
    try {
        return { data: await triggerIADeriveLib(identifier), error: null };
    } catch (e: any) {
        return { error: e.message || e };
    }
}
