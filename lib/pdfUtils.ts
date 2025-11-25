import * as pdfjsLib from 'pdfjs-dist';

// --- PDF WORKER INITIALIZATION ---
// We use CDNJS because esm.sh often has strict CORS on Web Workers or version mismatch issues.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfApi = (pdfjsLib as any).default || pdfjsLib;
if (typeof window !== 'undefined' && pdfApi) {
    if (!pdfApi.GlobalWorkerOptions.workerSrc) {
        pdfApi.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
}

/**
 * PDF Text Extractor with Layout Preservation (Spatial Analysis)
 */
export const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
        if (!pdfApi || !pdfApi.getDocument) {
            throw new Error("PDF Library not initialized correctly.");
        }

        const loadingTask = pdfApi.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = textContent.items.map((item: any) => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
                height: item.height || 10
            }));

            const lines: Record<string, typeof items> = {};
            const tolerance = 4;

            items.forEach(item => {
                const existingY = Object.keys(lines).find(y => Math.abs(Number(y) - item.y) < tolerance);
                const key = existingY || item.y.toString();
                if (!lines[key]) lines[key] = [];
                lines[key].push(item);
            });

            const sortedY = Object.keys(lines).sort((a, b) => Number(b) - Number(a));

            sortedY.forEach(y => {
                const lineItems = lines[y].sort((a, b) => a.x - b.x);
                let lineStr = '';
                let lastX = 0;
                if (lineItems.length > 0) lastX = lineItems[0].x;

                lineItems.forEach(item => {
                    const gap = item.x - lastX;
                    if (gap > 2) {
                        const spaces = Math.max(0, Math.floor(gap / 3.5));
                        lineStr += ' '.repeat(spaces);
                    }
                    lineStr += item.str;
                    lastX = item.x + item.width;
                });
                fullText += lineStr + '\n';
            });
            fullText += '\n';
        }
        return fullText;
    } catch (e: unknown) {
        console.error("PDF Extraction Error:", e);
        if (e instanceof Error) throw new Error("Could not read PDF. " + (e.message || "Worker failed."));
        else throw new Error("Could not read PDF. Unknown error.");
    }
};
