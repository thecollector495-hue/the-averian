
'use server';
/**
 * @fileOverview An AI flow for an aviary management assistant.
 *
 * - aviaryAssistant - A function that handles user queries to manage the aviary.
 * - AviaryAssistantInput - The input type for the aviaryAssistant function.
 * - AviaryAssistantOutput - The return type for the aviaryAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AviaryAssistantInputSchema = z.object({
  query: z.string().describe("The user's query or command."),
  context: z.string().describe("A JSON string of existing birds and notes to provide context for the query."),
});
export type AviaryAssistantInput = z.infer<typeof AviaryAssistantInputSchema>;

const AddBirdDataSchema = z.object({
    species: z.string(),
    subspecies: z.string().optional(),
    sex: z.enum(["male", "female", "unsexed"]),
    ringNumber: z.string().optional(),
    unbanded: z.boolean().optional(),
    visualMutations: z.array(z.string()).optional(),
    splitMutations: z.array(z.string()).optional(),
    status: z.enum(['Available', 'Sold', 'Deceased', 'Hand-rearing']).default('Available'),
}).describe("The data required to add a new bird.");

const UpdateBirdDataSchema = z.object({
    id: z.string().describe("The ID of the bird to update, found in the context."),
    updates: AddBirdDataSchema.partial().describe("The fields to update on the bird's record.")
}).describe("The data required to update an existing bird.");

const AddNoteDataSchema = z.object({
    title: z.string(),
    content: z.string().optional(),
    isReminder: z.boolean().optional(),
    reminderDate: z.string().optional().describe("The reminder date in YYYY-MM-DD format."),
}).describe("The data required to add a new note or reminder.");

const AddCageDataSchema = z.object({
    names: z.array(z.string()).describe("An array of names for the new cages to be created."),
}).describe("The data required to add one or more new cages.");

const AviaryAssistantOutputSchema = z.object({
  action: z.enum(['addBird', 'updateBird', 'addNote', 'addCage', 'answer']).describe("The action the assistant should take."),
  data: z.union([AddBirdDataSchema, UpdateBirdDataSchema, AddNoteDataSchema, AddCageDataSchema, z.null()]).describe("The data associated with the action."),
  response: z.string().describe("The assistant's text response to the user."),
});
export type AviaryAssistantOutput = z.infer<typeof AviaryAssistantOutputSchema>;

export async function aviaryAssistant(input: AviaryAssistantInput): Promise<AviaryAssistantOutput> {
  return assistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aviaryAssistantPrompt',
  input: {schema: AviaryAssistantInputSchema},
  output: {schema: AviaryAssistantOutputSchema},
  prompt: `You are an expert aviary assistant. Your goal is to help the user manage their birds and notes. You must understand queries in both English and Afrikaans, and you should respond in the same language as the user's query. You will be given a user's query and a JSON object containing the current state of their aviary (birds and notes).

Analyze the query and determine if the user wants to add or update an item.
- If they want to add a bird, use the 'addBird' action.
- If they want to update a bird, use the 'updateBird' action. You MUST find the bird's ID from the context.
- If they want to add a note or reminder, use the 'addNote' action.
- If they want to add one or more cages, use the 'addCage' action. If the user asks to add multiple cages, such as "cages 100 to 102", populate the 'names' array with each individual cage name: ["100", "101", "102"].
- If they are just asking a question or having a conversation, use the 'answer' action and provide a helpful text response. The data field should be null for 'answer' actions.

Always provide a friendly confirmation message in the 'response' field that summarizes the action taken or answers the user's question.

User query:
"{{{query}}}"

Aviary Context (existing data):
{{{context}}}
`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'aviaryAssistantFlow',
    inputSchema: AviaryAssistantInputSchema,
    outputSchema: AviaryAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
