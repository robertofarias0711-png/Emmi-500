import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    const ratioToUse = aspect_ratio || "1:1";

    // 1. Expansión semántica estricta mediante Llama 3
    let finalPrompt = '';
    try {
      const systemInstruction = `You are a cinematic prompt engineer for FLUX AI. 
Transform the user's input into a precise, highly realistic English image generation prompt.
- Preserve exact dog breeds (e.g., Pekingese = small, flat-faced, long-haired Pekingese dog).
- Capture human emotions deeply (grief, tears, sorrow, heartbreak).
- Describe lighting, scene, and composition.
- OUTPUT ONLY THE FINAL ENGLISH PROMPT. DO NOT USE QUOTES OR INTRODUCTORY TEXT.`;

      const textOutput: any = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: `${systemInstruction}\n\nUser Input: "${prompt}"\n\nEnhanced Prompt:`,
            max_new_tokens: 200,
            temperature: 0.3
          }
        }
      );

      if (textOutput) {
        finalPrompt = Array.isArray(textOutput) ? textOutput.join("").trim() : String(textOutput).trim();
      }
    } catch (e) {
      console.warn("Error en expansor Llama, usando fallback directo:", e);
    }

    // Fallback de respaldo si el expansor no responde
    if (!finalPrompt) {
      finalPrompt = `Heartbreaking photo of a man weeping in deep sorrow over his small long-haired Pekingese dog, emotional face, tears, cinematic lighting, 8k resolution`;
    }

    // Limpieza de caracteres extra
    finalPrompt = finalPrompt.replace(/^["']|["']$/g, '').trim();

    // 2. Renderizado con FLUX Dev
    const output: any = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          prompt: finalPrompt,
          num_outputs: 1,
          aspect_ratio: ratioToUse,
          output_format: "webp",
          output_quality: 90,
          disable_safety_checker: true
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl) {
      throw new Error("No se pudo obtener la imagen desde Replicate");
    }

    // 3. Conversión a Base64 para garantizar la descarga local
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en API de Replicate:", error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}