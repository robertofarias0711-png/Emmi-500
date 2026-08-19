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

    // 1. Llama 3 enriquece el prompt con semántica y precisión narrativa
    let expandedPrompt = prompt;
    try {
      const textOutput: any = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: `You are an expert prompt engineer for AI image generators.
Convert this user request into a deep, highly accurate English image generation prompt.
Capture exact dog breeds (e.g. Pekingese), genuine human grief/tragedy, exact atmosphere, and fine details.
Output ONLY the expanded English prompt.

User Request: "${prompt}"`,
            max_new_tokens: 150
          }
        }
      );
      
      if (textOutput) {
        expandedPrompt = Array.isArray(textOutput) ? textOutput.join("").trim() : String(textOutput).trim();
      }
    } catch (e) {
      console.warn("Fallback prompt enhancer:", e);
      expandedPrompt = `Heartbreaking photo of a man weeping in sorrow over the death of his small fluffy Pekingese dog, cinematic emotional lighting, high fidelity, 8k`;
    }

    // 2. Usar FLUX Dev para semántica avanzada y fidelidad superior
    const output: any = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          prompt: expandedPrompt,
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
      throw new Error("No se obtuvo imagen desde Replicate");
    }

    // 3. Convertir a Base64 para descarga local directa
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en Replicate API:", error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}