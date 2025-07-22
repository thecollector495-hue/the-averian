/**
 * @fileOverview A service for parsing text content from a PDF file hosted at a public URL.
 * - extractTextFromPdfUrl - Fetches a PDF and extracts its text.
 */

import pdf from 'pdf-parse';

export async function extractTextFromPdfUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF. Status: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const data = await pdf(buffer);
        return data.text;
    } catch (error: any) {
        console.error('Error processing PDF from URL:', error);
        throw new Error(`Could not process PDF from URL: ${error.message}`);
    }
}
