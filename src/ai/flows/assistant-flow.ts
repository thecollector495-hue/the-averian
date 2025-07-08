
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
    // Sale details for updates
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

const AddMutationDataSchema = z.object({
    names: z.array(z.string()).describe("An array of names for the new mutations to be created."),
}).describe("The data required to add one or more new mutations.");

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

const ActionSchema = z.object({
    action: z.enum(['addBird', 'updateBird', 'addNote', 'updateNote', 'addCage', 'updateCage', 'addMutation', 'deleteBird', 'deleteCage', 'deleteNote', 'deleteTransaction', 'answer', 'addTransaction']).describe("The action the assistant should take."),
    data: z.union([AddBirdDataSchema, UpdateBirdDataSchema, AddNoteDataSchema, UpdateNoteDataSchema, AddCageDataSchema, UpdateCageDataSchema, AddMutationDataSchema, DeleteDataSchema, AddTransactionDataSchema, z.null()]).describe("The data associated with the action. This should be null for 'answer' actions."),
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

You MUST parse the user's entire query and not miss any details. For complex commands, break them down into multiple actions. For example, if a user asks to add cages with a cost and a related note, you must create actions for BOTH adding the cages (with the cost) AND adding the note.

Analyze the query and determine a list of actions the user wants to perform. You can perform multiple actions for a single query. For example, if the user asks to add two birds, you should return two 'addBird' actions in the 'actions' array.

- If they want to add a bird, use the 'addBird' action. If they mention a cage, include it in the 'cageName' field.
- If they want to update a bird, use the 'updateBird' action. You MUST find the bird's ID from the context.
- If they want to add a note or reminder, use the 'addNote' action. If the note refers to other items (like newly created cages), make sure to reference them in the note's title or content for clarity. For example, if adding cages A1-A5, the note content could be "Move Conures to new cages A1-A5".
- If they want to update a note, use the 'updateNote' action. You MUST find the note's ID.
- If they want to add one or more cages, use the 'addCage' action. If the user asks to add multiple cages, such as "cages 100 to 102", populate the 'names' array with each individual cage name: ["100", "101", "102"]. If they mention a cost, you MUST include it in the 'cost' field.
- If they want to update a cage's name or cost, use 'updateCage'. You MUST find the cage's ID.
- To remove items, use 'deleteBird', 'deleteCage', 'deleteNote', or 'deleteTransaction'. Find the ID(s) of the item(s) to remove from the context.
- If they want to add a transaction, use 'addTransaction'.
- **IMPORTANT**: If a user asks to sell a bird (e.g., "sell bird A123 for 500 to John"), you must generate TWO actions:
    1. An 'updateBird' action. Set the 'status' to 'Sold' and include 'salePrice', 'saleDate' (in YYYY-MM-DD format, use today if not specified), and 'buyerInfo' in the 'updates' object.
    2. An 'addTransaction' action. Set the 'type' to 'income', and include the 'amount', 'description', and 'relatedBirdId'.
- If they want to add one or more mutations, use the 'addMutation' action.
- If they are just asking a question or having a conversation, use the 'answer' action and provide a helpful text response. The data field should be null for 'answer' actions.

**Genetic Calculations**:
If the user asks to calculate genetic outcomes for a pair, use the 'answer' action. Your response should explain the expected offspring based on their visual and split mutations from the context.
For common sex-linked recessive mutations (like Opaline, Cinnamon, Lutino), use the following logic (Male ZZ, Female ZW):
- A visual male (Z-gene/Z-gene) x normal female (Z/W) -> 100% visual females, 100% split males.
- A split male (Z-gene/Z) x normal female (Z/W) -> 50% visual females, 50% normal females, 50% split males, 50% normal males.
- A normal male (Z/Z) x visual female (Z-gene/W) -> 100% normal females, 100% split males.
- A split male (Z-gene/Z) x visual female (Z-gene/W) -> 50% visual females, 50% normal females, 50% visual males, 50% split males.
Treat other mutations as simple autosomal recessive. A bird needs two copies to be visual, one copy means it is "split".

For any set of actions that will add, update, or delete data, your text 'response' should clearly state what you are about to do and ask for confirmation. For example: "I'm ready to mark bird A123 as sold and add an income transaction of R500. Please confirm." or "I'm ready to add 10 cages at a cost of R500 each and create a reminder note. Please confirm."

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
