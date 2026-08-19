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

    // 1. Convertir la idea en español a un prompt cinemático y detallado en inglés usando una IA de texto
    let expandedPrompt = prompt;
    try {
      const textOutput: any = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: `You are an expert prompt engineer for AI image generation models (FLUX/Midjourney).
Translate and enhance this user request into a highly descriptive, cinematic, detailed English prompt for image generation.
Ensure emotional depth, accurate subject features, atmosphere, and lighting. Do NOT add conversation, only output the final enhanced prompt in English.

User request: "${prompt}"`,
            max_new_tokens: 150
          }
        }
      );
      
      if (textOutput) {
        expandedPrompt = Array.isArray(textOutput) ? textOutput.join("").trim() : String(textOutput).trim();
      }
    } catch (e) {
      console.warn("Falló la expansión de texto, usando fallback básico:", e);
      expandedPrompt = `High quality, highly detailed image of: ${prompt}, cinematic lighting, photorealistic, 8k`;
    }

    // 2. Enviar el prompt perfecto a FLUX Schnell
    const output: any = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: expandedPrompt,
          num_outputs: 1,
          aspect_ratio: ratioToUse,
          output_format: "webp",
          output_quality: 80,
          disable_safety_checker: true
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl) {
      throw new Error("No se obtuvo URL de imagen desde Replicate");
    }

    // 3. Convertir a Base64 para garantizar la descarga limpia
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en Replicate API:", error);

    return NextResponse.json(
      { error: error.message || 'Ocurrió un error al procesar la imagen' },
      { status: 500 }
    );
  }
}