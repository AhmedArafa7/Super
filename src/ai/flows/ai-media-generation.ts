
'use server';
/**
 * @fileOverview وحدة توليد الوسائط الفائقة (صورة وفيديو).
 * تم تحسين معالجة أخطاء الصلاحيات والحصص لضمان استقرار النظام البصري.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function generateNeuralImage(prompt: string) {
  try {
    return await generateImageFlow(prompt);
  } catch (err: any) {
    console.error("Image Generation Error:", err);
    if (err.message?.includes('Generative Language API') || err.message?.includes('403')) {
      throw new Error("يجب تفعيل 'Generative Language API' لتوليد الصور عصبياً.");
    }
    throw err;
  }
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: z.string(),
    outputSchema: z.object({ url: z.string() }),
  },
  async (prompt) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Cinematic, futuristic, high detail, nexus cyberpunk style: ${prompt}`,
    });
    
    if (!media) throw new Error("Image Generation Failed");
    return { url: media.url };
  }
);

export async function generateNeuralVideo(prompt: string) {
  try {
    return await generateVideoFlow(prompt);
  } catch (err: any) {
    console.error("Video Generation Error:", err);
    if (err.message?.includes('Generative Language API') || err.message?.includes('403')) {
      throw new Error("يجب تفعيل 'Generative Language API' لتوليد الفيديوهات عصبياً.");
    }
    throw err;
  }
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: z.string(),
    outputSchema: z.object({ url: z.string(), status: z.string() }),
  },
  async (prompt) => {
    // ملاحظة: Veo 3 يتطلب وقت طويل للمزامنة
    const { operation } = await ai.generate({
      model: 'googleai/veo-3.0-generate-preview',
      prompt: `High-end cinematic cinematic 4k: ${prompt}`,
    });

    if (!operation) throw new Error("Video Node Unreachable");
    
    return { 
      url: "", // سيعود لاحقاً عبر التحديثات
      status: "Operation Started",
      opId: operation.name 
    };
  }
);
