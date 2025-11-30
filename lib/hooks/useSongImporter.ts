import { useState } from 'react';
import { supabase } from '../supabase';
import { convertToChordPro } from '../musicUtils';
import { extractTextFromPdf } from '../pdfUtils';
import * as mammoth from 'mammoth';

export interface ImportStatus {
    type: 'success' | 'error';
    msg: string;
}

export const useSongImporter = () => {
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

    const processFile = async (file: File): Promise<{ rawText: string; title?: string; artist?: string } | null> => {
        setIsProcessingFile(true);
        setImportStatus(null);
        try {
            let rawContent = "";

            if (file.name.toLowerCase().endsWith('.pdf')) {
                const arrayBuffer = await file.arrayBuffer();
                rawContent = await extractTextFromPdf(arrayBuffer);
            }
            else if (file.name.toLowerCase().endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                rawContent = result.value;
            }
            else {
                rawContent = await file.text();
            }

            if (!rawContent || rawContent.length < 10) throw new Error("File is empty or too short.");

            const processedText = convertToChordPro(rawContent);
            const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
            const detectedTitle = lines[0]?.replace(/\[.*?\]/g, '').trim() || "";
            const artistLine = lines.slice(0, 5).find(l => l.toLowerCase().includes('by '));
            const detectedArtist = artistLine ? artistLine.replace(/^by\s+/i, '').trim() : "";

            setImportStatus({ type: 'success', msg: `Processed "${file.name}" successfully.` });
            return { rawText: processedText, title: detectedTitle, artist: detectedArtist };

        } catch (error: any) {
            console.error(error);
            setImportStatus({ type: 'error', msg: "Failed to process file. " + (error.message || "Unknown error") });
            return null;
        } finally {
            setIsProcessingFile(false);
        }
    };

    const scrapeUrl = async (url: string): Promise<{ rawText: string; title?: string; artist?: string } | null> => {
        if (!url) return null;
        setIsScraping(true);
        setImportStatus(null);

        try {
            const { data, error } = await supabase.functions.invoke('scrape-song', {
                body: { url }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setImportStatus({ type: 'success', msg: `Successfully scraped "${data.title}"` });
            return {
                rawText: data.rawText,
                title: data.title,
                artist: data.artist
            };
        } catch (err: any) {
            setImportStatus({ type: 'error', msg: "Scrape failed: " + (err.message || "Unknown error") });
            return null;
        } finally {
            setIsScraping(false);
        }
    };

    return {
        isProcessingFile,
        isScraping,
        importStatus,
        setImportStatus,
        processFile,
        scrapeUrl
    };
};
