
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
    cageName: z.string().optional().describe("The name of the cage to put the bird in. Can be an existing cage or a new one."),
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

const UpdateNoteDataSchema = z.object({
    id: z.string().describe("The ID of the note to update."),
    updates: AddNoteDataSchema.partial().describe("The fields to update on the note's record.")
}).describe("The data required to update an existing note.");

const AddCageDataSchema = z.object({
    names: z.array(z.string()).describe("An array of names for the new cages to be created."),
}).describe("The data required to add one or more new cages.");

const UpdateCageDataSchema = z.object({
    id: z.string().describe("The ID of the cage to update."),
    updates: z.object({ name: z.string() }).describe("The fields to update on the cage's record. Currently only 'name' is supported.")
}).describe("The data required to update an existing cage.");

const AddMutationDataSchema = z.object({
    names: z.array(z.string()).describe("An array of names for the new mutations to be created."),
}).describe("The data required to add one or more new mutations.");

const DeleteDataSchema = z.object({
    ids: z.array(z.string()).describe("An array of IDs for the items to be deleted."),
}).describe("The data required to delete one or more items.");

const ActionSchema = z.object({
    action: z.enum(['addBird', 'updateBird', 'addNote', 'updateNote', 'addCage', 'updateCage', 'addMutation', 'deleteBird', 'deleteCage', 'deleteNote', 'answer']).describe("The action the assistant should take."),
    data: z.union([AddBirdDataSchema, UpdateBirdDataSchema, AddNoteDataSchema, UpdateNoteDataSchema, AddCageDataSchema, UpdateCageDataSchema, AddMutationDataSchema, DeleteDataSchema, z.null()]).describe("The data associated with the action. This should be null for 'answer' actions."),
});

const AviaryAssistantOutputSchema = z.object({
  actions: z.array(ActionSchema).describe("A list of actions for the assistant to take based on the user's query."),
  response: z.string().describe("The assistant's friendly text response to the user, summarizing the actions taken."),
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

Analyze the query and determine a list of actions the user wants to perform. You can perform multiple actions for a single query. For example, if the user asks to add two birds, you should return two 'addBird' actions in the 'actions' array.

- If they want to add a bird, use the 'addBird' action. If they mention a cage, include it in the 'cageName' field.
- If they want to update a bird, use the 'updateBird' action. You MUST find the bird's ID from the context.
- If they want to add a note or reminder, use the 'addNote' action.
- If they want to update a note, use the 'updateNote' action. You MUST find the note's ID.
- If they want to add one or more cages, use the 'addCage' action. If the user asks to add multiple cages, such as "cages 100 to 102", populate the 'names' array with each individual cage name: ["100", "101", "102"].
- If they want to update a cage's name, use 'updateCage'. You MUST find the cage's ID.
- To remove items, use 'deleteBird', 'deleteCage', or 'deleteNote'. Find the ID(s) of the item(s) to remove. For deletions, your text response should confirm what you are about to do, as the user will need to confirm this action in the UI. For example "I am ready to delete 15 cages. Please confirm."
- If they want to add one or more mutations, use the 'addMutation' action.
- If they are just asking a question or having a conversation, use the 'answer' action and provide a helpful text response. The data field should be null for 'answer' actions.

Always provide a friendly confirmation message in the 'response' field that summarizes all actions taken or answers the user's question.

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
