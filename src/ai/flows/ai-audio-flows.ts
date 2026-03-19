
'use server';
/**
 * @fileOverview وحدة التخاطب الصوتي (Text-to-Speech).
 * تم تحصين الوحدة ضد أخطاء تجاوز الحصص (Quota Exceeded) لضمان استقرار النظام.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

/**
 * وظيفة تحويل النص إلى نطق عصبي - محصنة لتعيد استجابة منظمة في حال الفشل.
 */
export async function textToNeuralSpeech(text: string) {
  try {
    const result = await ttsFlow(text);
    return { success: true, audioUrl: result.audioUrl };
  } catch (err: any) {
    console.error("Neural TTS Failure:", err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "فشل النظام في توليد الصوت حالياً.",
      isQuotaError: err.message?.includes('429') || err.message?.includes('quota')
    };
  }
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: z.string(),
    outputSchema: z.object({ audioUrl: z.string() }),
  },
  async (text) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });

    if (!media) throw new Error('No Audio Media Generated');

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      audioUrl: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}
