'use server';

/**
 * @fileOverview A welcome message AI agent.
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
  output: {schema: WelcomeMessageOutputSchema},
  prompt: `You are an AI assistant. Generate a welcome message to the user of the application NexusAI. The welcome message should be friendly and introduce the user to the features of the application, which are AI Chat, StreamHub, and TechMarket.`,
});

const welcomeMessageFlow = ai.defineFlow(
  {
    name: 'welcomeMessageFlow',
    outputSchema: WelcomeMessageOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
