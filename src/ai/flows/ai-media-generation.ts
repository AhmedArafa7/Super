
'use server';
/**
 * @fileOverview وحدة توليد الوسائط الفائقة (صورة وفيديو).
 * تم تحسين تشخيص الأخطاء لتوجيه المستخدم لصفحة الإعدادات الصحيحة.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PROJECT_ID = "studio-3522991053-84d29";

export async function generateNeuralImage(prompt: string) {
  try {
    return await generateImageFlow(prompt);
  } catch (err: any) {
    console.error("Image Generation Error:", err);
    const msg = err.message || "";
    if (msg.includes('Generative Language API') || msg.includes('403')) {
      throw new Error(`يجب التأكد من إنشاء API Key صالح لهذا المشروع: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=${PROJECT_ID}`);
    }
    throw new Error("فشل توليد الصورة عصبياً. تأكد من اتصالك بالشبكة.");
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
    throw new Error("توليد الفيديو يتطلب حصصاً مرتفعة ومفتاح API خاص بالمؤسسات.");
  }
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: z.string(),
    outputSchema: z.object({ url: z.string(), status: z.string() }),
  },
  async (prompt) => {
    const { operation } = await ai.generate({
      model: 'googleai/veo-3.0-generate-preview',
      prompt: `High-end cinematic cinematic 4k: ${prompt}`,
    });

    if (!operation) throw new Error("Video Node Unreachable");
    
    return { 
      url: "", 
      status: "Operation Started",
      opId: operation.name 
    };
  }
);
