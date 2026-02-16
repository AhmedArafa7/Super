'use server';

/**
 * @fileOverview A welcome message AI agent powered by Groq Llama 3.3.
 *
 * - getWelcomeMessage - A function that returns a welcome message.
 * - WelcomeMessageOutput - The return type for the getWelcomeMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WelcomeMessageOutputSchema = z.object({
  message: z.string().describe('A welcome message to the user.'),
});
export type WelcomeMessageOutput = z.infer<typeof WelcomeMessageOutputSchema>;

export async function getWelcomeMessage(): Promise<WelcomeMessageOutput> {
  return welcomeMessageFlow();
}

const prompt = ai.definePrompt({
  name: 'welcomeMessagePrompt',
  // We remove output.schema here to handle raw text response correctly
  prompt: `You are the NexusAI Core Assistant. 
Generate a friendly and professional welcome message in Arabic.
Introduce the user to NexusAI's core features:
1. AI Chat (Powered by Llama 3.3 via Groq)
2. StreamHub (Decentralized content)
3. TechMarket (Institutional asset exchange)
Keep it inspiring and futuristic.`,
});

const welcomeMessageFlow = ai.defineFlow(
  {
    name: 'welcomeMessageFlow',
    outputSchema: WelcomeMessageOutputSchema,
  },
  async () => {
    // Get raw response from model
    const response = await prompt({});
    
    // Return wrapped text matching the flow output schema
    return {
      message: response.text || "مرحباً بك في NexusAI، المحرك العصبي المتطور."
    };
  }
);
