'use server';
/**
 * @fileOverview An AI flow for identifying bird species from a photo.
 *
 * - identifyBird - A function that handles the bird identification process.
 * - BirdIdentificationInput - The input type for the identifyBird function.
 * - BirdIdentificationOutput - The return type for the identifyBird function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const BirdIdentificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a bird, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userDescription: z.string().describe('Optional user-provided notes about the bird.').optional(),
});
export type BirdIdentificationInput = z.infer<typeof BirdIdentificationInputSchema>;

const BirdIdentificationOutputSchema = z.object({
  isBird: z.boolean().describe('Whether or not the image is determined to contain a bird.'),
  commonName: z.string().describe("The most likely common name of the identified bird. Provide a guess even if uncertain."),
  latinName: z.string().describe("The most likely scientific (Latin) name of the identified bird."),
  confidence: z.number().min(0).max(1).describe("A confidence score from 0.0 to 1.0 in the identification."),
  physicalDescription: z.string().describe("A detailed physical description of the bird in the photo."),
  potentialMutations: z.array(z.string()).describe("A list of any potential color mutations visible on the bird."),
  interestingFact: z.string().describe("An interesting fact about the identified bird species."),
});
export type BirdIdentificationOutput = z.infer<typeof BirdIdentificationOutputSchema>;

export async function identifyBird(input: BirdIdentificationInput): Promise<BirdIdentificationOutput> {
  return identifyBirdFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyBirdPrompt',
  input: {schema: BirdIdentificationInputSchema},
  output: {schema: BirdIdentificationOutputSchema},
  prompt: `You are a world-class ornithologist with expertise in identifying bird species and color mutations from images. Analyze the provided image and user description to identify the bird.

If the image does not contain a bird, set the 'isBird' flag to false and briefly explain why in the 'physicalDescription' field, leaving other fields empty or with default values.

If a bird is present, identify its common and scientific name. Provide a confidence score for your identification.
Describe the bird's physical appearance in detail.
Based on its plumage, list any potential genetic color mutations you observe.
Finally, provide one interesting fact about the species.

{{#if userDescription}}
The user has provided the following notes:
"{{{userDescription}}}"
{{/if}}

Image to analyze: {{media url=photoDataUri}}`,
});

const identifyBirdFlow = ai.defineFlow(
  {
    name: 'identifyBirdFlow',
    inputSchema: BirdIdentificationInputSchema,
    outputSchema: BirdIdentificationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
