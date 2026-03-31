import { NextRequest, NextResponse } from "next/server";
import { uploadToInternetArchive } from "@/lib/internetArchive";

/**
 * Next.js API Route for Internet Archive uploads.
 * Proxies the file stream to IA, keeping credentials secure on the server.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = (formData.get("file") as File) || new File([], "empty");
        const coverFile = formData.get("coverFile") as File | null;
        
        // Metadata passed as JSON
        const metadataStr = formData.get("metadata") as string;
        const metadata = metadataStr ? JSON.parse(metadataStr) : {};
        
        const existingIdentifier = formData.get("existingIdentifier") as string || undefined;

        // If it's a NEW item (no existingIdentifier), we MUST have a main file.
        // For existing items, we just need the metadata title and at least one change.
        if (!existingIdentifier && file.size === 0) {
            return NextResponse.json({ error: "Missing file for new upload" }, { status: 400 });
        }

        if (!metadata.title) {
            return NextResponse.json({ error: "Missing metadata title" }, { status: 400 });
        }

        // Call our library (which will now correctly see the server-side IA_ACCESS_KEY)
        const result = await uploadToInternetArchive(
            file,
            metadata,
            coverFile,
            undefined, // AbortSignal not easily passed over API
            existingIdentifier
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("IA API Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

// Increase duration for large file uploads on platforms like Vercel
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';
