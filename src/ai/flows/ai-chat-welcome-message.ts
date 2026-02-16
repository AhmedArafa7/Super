'use server';

/**
 * @fileOverview A concise welcome message AI agent powered by Groq Llama 3.3.
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
  prompt: `You are the NexusAI Assistant. 
Generate a VERY CONCISE and inspiring welcome message in Arabic (max 2-3 sentences).
Greet the user to the NexusAI ecosystem and mention that AI Chat, StreamHub, and TechMarket are ready for synchronization.
Keep it futuristic and professional.`,
});

const welcomeMessageFlow = ai.defineFlow(
  {
    name: 'welcomeMessageFlow',
    outputSchema: WelcomeMessageOutputSchema,
  },
  async () => {
    const response = await prompt({});
    return {
      message: response.text || "مرحباً بك في NexusAI. جميع الأنظمة العصبية جاهزة للمزامنة."
    };
  }
);
