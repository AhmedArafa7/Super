
'use server';
/**
 * @fileOverview AI Chat response generation flow.
 *
 * - aiChatGenerateResponse - A function that generates context-aware AI responses.
 * - AIChatGenerateResponseInput - The input type for the aiChatGenerateResponse function.
 * - AIChatGenerateResponseOutput - The return type for the aiChatGenerateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatGenerateResponseInputSchema = z.object({
  message: z.string().describe('The user message to respond to.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history.'),
});
export type AIChatGenerateResponseInput = z.infer<typeof AIChatGenerateResponseInputSchema>;

const AIChatGenerateResponseOutputSchema = z.object({
  response: z.string().describe('The AI generated response.'),
});
export type AIChatGenerateResponseOutput = z.infer<typeof AIChatGenerateResponseOutputSchema>;

export async function aiChatGenerateResponse(input: AIChatGenerateResponseInput): Promise<AIChatGenerateResponseOutput> {
  return aiChatGenerateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
  input: {schema: AIChatGenerateResponseInputSchema},
  output: {schema: AIChatGenerateResponseOutputSchema},
  prompt: `You are a helpful AI assistant for NexusAI. Respond to the user message based on the chat history, if any. Be concise, technical, and helpful.

Chat History:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

User: {{{message}}}

Response: `,
});

const aiChatGenerateResponseFlow = ai.defineFlow(
  {
    name: 'aiChatGenerateResponseFlow',
    inputSchema: AIChatGenerateResponseInputSchema,
    outputSchema: AIChatGenerateResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
