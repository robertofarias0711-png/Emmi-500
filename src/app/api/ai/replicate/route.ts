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

    // 1. System Prompt para forzar la correcta interpretación de duelo, ausencias y detalles exactos
    let expandedPrompt = prompt;
    try {
      const textOutput: any = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: `You are an expert prompt engineer for FLUX AI. 
Convert the user request into an explicit, highly detailed English image prompt.

CRITICAL RULES:
1. If the user mentions grief, loss, or a dead pet, DO NOT show a living, happy pet. Show the emotional human weeping, holding a pet memorial, an empty collar, a leash, or a photograph, capturing pure sorrow and heartbreak.
2. Be extremely specific with dog breeds (e.g. Pekingese = small fluffy Pekingese dog features).
3. Specify dramatic, moody lighting and realistic human expressions (tears, anguish, distress).
4. Output ONLY the final English prompt string, no explanations.

User Request: "${prompt}"`,
            max_new_tokens: 150
          }
        }
      );
      
      if (textOutput) {
        expandedPrompt = Array.isArray(textOutput) ? textOutput.join("").trim() : String(textOutput).trim();
      }
    } catch (e) {
      console.warn("Falló Llama 3, usando fallback:", e);
      expandedPrompt = `Cinematic photo of a man weeping in heartbreak over the loss of his Pekingese dog, holding an empty leash, dramatic sorrowful lighting, highly detailed emotional face, 8k`;
    }

    // 2. Generar en FLUX
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
      throw new Error("No se obtuvo imagen");
    }

    // 3. Convertir a Base64 para la descarga
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en Replicate API:", error);
    return NextResponse.json(
      { error: error.message || 'Error al generar la imagen' },
      { status: 500 }
    );
  }
}