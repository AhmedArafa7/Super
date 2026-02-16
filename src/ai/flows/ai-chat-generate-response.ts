'use server';
/**
 * @fileOverview AI Chat response generation flow using Groq Llama 3.3.
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
    role: z.enum(['user', 'model']),
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
  prompt: `You are a highly intelligent AI assistant for the NexusAI ecosystem. 
Your primary engine is Llama 3.3 70B via Groq.
Be technical, helpful, and concise. Respond in the same language as the user (prefer Arabic if the user speaks Arabic).

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