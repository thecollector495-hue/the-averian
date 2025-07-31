
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
  context: z.string().describe("A JSON string of existing birds, notes, cages, and financial transactions to provide context for the query."),
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
    salePrice: z.number().optional().describe("The price the bird was sold for."),
    saleDate: z.string().optional().describe("The date the bird was sold in YYYY-MM-DD format."),
    buyerInfo: z.string().optional().describe("Information about the buyer."),
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
    cost: z.number().optional().describe("The cost for each new cage. This single cost will be applied to every cage being added."),
}).describe("The data required to add one or more new cages, optionally with a cost for each.");

const UpdateCageDataSchema = z.object({
    id: z.string().describe("The ID of the cage to update."),
    updates: z.object({ 
        name: z.string().optional(),
        cost: z.number().optional()
    }).describe("The fields to update on the cage's record. Supported fields are 'name' and 'cost'.")
}).describe("The data required to update an existing cage.");

const DeleteDataSchema = z.object({
    ids: z.array(z.string()).describe("An array of IDs for the items to be deleted."),
}).describe("The data required to delete one or more items.");

const AddTransactionDataSchema = z.object({
    type: z.enum(['income', 'expense']),
    date: z.string().describe("The date of the transaction in YYYY-MM-DD format."),
    description: z.string(),
    amount: z.number(),
    relatedBirdId: z.string().optional().describe("The ID of a bird related to this transaction."),
}).describe("The data required to add a new financial transaction.");

const AddSpeciesDataSchema = z.object({
    name: z.string().describe("The name of the new species, formatted as 'Common Name - Scientific Name'. This is a REQUIRED field."),
    incubationPeriod: z.number().describe("The incubation period in days. This is a REQUIRED field."),
    subspecies: z.array(z.string()).optional().describe("An optional list of subspecies names. Each subspecies must be a string formatted as 'Common Name - Scientific Name'."),
}).describe("The data required to add a new species.");

const ActionSchema = z.object({
    action: z.enum([
        'addBird', 'updateBird', 'deleteBird',
        'addCage', 'updateCage', 'deleteCage',
        'addNote', 'updateNote', 'deleteNote',
        'addTransaction', 'deleteTransaction',
        'addSpecies', 'deleteSpecies',
        'answer'
    ]).describe("The action the assistant should take."),
    data: z.union([
        AddBirdDataSchema, UpdateBirdDataSchema,
        AddCageDataSchema, UpdateCageDataSchema,
        AddNoteDataSchema, UpdateNoteDataSchema,
        AddTransactionDataSchema,
        AddSpeciesDataSchema,
        DeleteDataSchema,
        z.null()
    ]).describe("The data associated with the action. This should be null for 'answer' actions."),
});

const AviaryAssistantOutputSchema = z.object({
  actions: z.array(ActionSchema).describe("A list of actions for the assistant to take based on the user's query."),
  response: z.string().describe("The assistant's friendly text response to the user, summarizing the actions taken or asking for more information."),
  error: z.string().optional(),
});
export type AviaryAssistantOutput = z.infer<typeof AviaryAssistantOutputSchema>;

export async function aviaryAssistant(input: AviaryAssistantInput): Promise<AviaryAssistantOutput> {
  try {
    const output = await assistantFlow(input);
    if (!output?.response) {
        throw new Error("Received an empty response from the AI model.");
    }
    return output;
  } catch (e: any) {
    console.error("Error in assistant flow", e);
    const errorMessage = e.message?.includes('503') || e.message?.includes('overloaded')
        ? "The AI model is currently overloaded. Please try again in a moment."
        : "An unexpected error occurred. Please try again.";
    return {
        actions: [],
        response: errorMessage,
        error: e.message || 'An unknown error occurred in the AI flow.',
    }
  }
}

const promptTemplate = `You are an expert aviary management assistant. Your goal is to help the user manage their birds, cages, notes, finances, and custom data like species. You must understand queries in both English and Afrikaans, and you should respond in the same language as the user's query. You will be given a user's query and a JSON object containing the current state of their aviary.

You MUST parse the user's entire query and not miss any details. For complex commands, break them down into multiple actions. Your primary task is to determine a list of final, data-modifying actions to return.

- ADDING/UPDATING DATA:
  - To add a bird, use 'addBird'.
  - To update a bird, use 'updateBird'. You MUST find the bird's ID from the context.
  - To add a note/reminder, use 'addNote'.
  - To update a note, use 'updateNote'. Find the note's ID.
  - To add cages, use 'addCage'. Handle ranges like "cages 100 to 102" by creating an action for each cage name: ["100", "101", "102"].
  - To update a cage, use 'updateCage'. Find the cage's ID.
  - To add a transaction, use 'addTransaction'.
  - To add a species, use 'addSpecies'.

- DELETING DATA:
  - To remove items, use 'deleteBird', 'deleteCage', 'deleteNote', 'deleteTransaction', 'deleteSpecies'. Find the ID(s) of the item(s) to remove from the context.

- SPECIAL INSTRUCTIONS:
  - **SELLING A BIRD**: If a user asks to sell a bird (e.g., "sell bird A123 for 500 to John"), you must generate TWO actions:
    1. An 'updateBird' action: Set status to 'Sold', include 'salePrice', 'saleDate' (YYYY-MM-DD), and 'buyerInfo'.
    2. An 'addTransaction' action: Set type to 'income', include 'amount', 'description', and 'relatedBirdId'.
  - **ADDING CAGE WITH COST**: If a user adds cages with a cost, generate an 'addCage' action AND an 'addTransaction' action of type 'expense' for each cage.

- CONFIRMATION & RESPONSE:
  - For any actions that will change data, your text 'response' should clearly state what you are about to do and ask for confirmation.
  - Always provide a friendly confirmation message in the 'response' field that summarizes all actions taken or answers the user's question.
  - If the user is just asking a question or having a conversation, use the 'answer' action and provide a helpful text response. The data field should be null for 'answer' actions.

User query:
"{{{query}}}"

Aviary Context (existing data):
{{{context}}}
`;

const prompt = ai.definePrompt({
  name: 'aviaryAssistantPrompt',
  input: {schema: AviaryAssistantInputSchema},
  output: {schema: AviaryAssistantOutputSchema},
  prompt: promptTemplate,
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
