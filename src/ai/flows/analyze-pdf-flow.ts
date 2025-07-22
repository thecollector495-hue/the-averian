
'use server';
/**
 * @fileOverview An AI flow to analyze text from a PDF and extract genetic mutations.
 * 
 * - analyzeMutations - A function that handles the mutation analysis process.
 * - MutationAnalysisInput - The input type for the analyzeMutations function.
 * - MutationAnalysisOutput - The return type for the analyzeMutations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { extractTextFromPdfUrl } from '@/services/pdf-service';
import { inheritanceTypes } from '@/lib/data';

const MutationAnalysisInputSchema = z.object({
  pdfUrl: z.string().url().describe('A public URL to a PDF file containing mutation information.'),
});
export type MutationAnalysisInput = z.infer<typeof MutationAnalysisInputSchema>;

const FoundMutationSchema = z.object({
    name: z.string().describe("The name of the mutation found in the document."),
    inheritance: z.enum(inheritanceTypes).describe("The genetic inheritance type of the mutation."),
});

const MutationAnalysisOutputSchema = z.object({
    mutations: z.array(FoundMutationSchema).describe("A list of mutations extracted from the PDF document."),
    error: z.string().optional().describe("Any error message if the process fails."),
});
export type MutationAnalysisOutput = z.infer<typeof MutationAnalysisOutputSchema>;


const extractPdfTextTool = ai.defineTool(
    {
        name: 'extractPdfTextTool',
        description: 'Extracts all text content from a PDF file located at a public URL.',
        inputSchema: z.object({ url: z.string().url() }),
        outputSchema: z.string(),
    },
    async (input) => extractTextFromPdfUrl(input.url)
);


const analyzeMutationsPrompt = ai.definePrompt({
  name: 'analyzeMutationsPrompt',
  input: { schema: z.object({ documentText: z.string() }) },
  output: { schema: MutationAnalysisOutputSchema },
  prompt: `You are an expert in avian genetics. Analyze the following text extracted from a document. Your task is to identify all genetic mutations and their corresponding inheritance patterns.

The valid inheritance patterns are: ${inheritanceTypes.join(', ')}.

Carefully read the text and extract every mutation mentioned. For each mutation, determine its inheritance type based on the context. If a mutation is mentioned but its inheritance type is not clearly one of the valid types, do not include it. Return the data as a list of mutations.

Document Text:
{{{documentText}}}
`,
});

const analyzeMutationsFlow = ai.defineFlow(
  {
    name: 'analyzeMutationsFlow',
    inputSchema: MutationAnalysisInputSchema,
    outputSchema: MutationAnalysisOutputSchema,
  },
  async (input) => {
    try {
        const pdfText = await extractPdfTextTool({ url: input.pdfUrl });
        if (!pdfText.trim()) {
            return { mutations: [], error: "The PDF appears to be empty or contains no readable text." };
        }
        
        const { output } = await analyzeMutationsPrompt({ documentText: pdfText });
        return output || { mutations: [], error: "AI analysis did not return a result." };

    } catch (e: any) {
        console.error("Error in analyzeMutationsFlow:", e);
        return {
            mutations: [],
            error: `An error occurred during PDF analysis: ${e.message}`,
        };
    }
  }
);


export async function analyzeMutations(input: MutationAnalysisInput): Promise<MutationAnalysisOutput> {
    return analyzeMutationsFlow(input);
}
