import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    const ratioToUse = aspect_ratio || "1:1";

    // 1. Reescritura estricta con GPT-4o-mini
    let finalPrompt = prompt;
    try {
      const gptResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cinematic prompt engineer for AI image generation (FLUX Dev).
Transform the user input into an explicit English prompt following these STRICT VISUAL RULES:

1. ABSENCE & DEATH: If the user mentions death, loss, or grief of a pet, DO NOT describe a living, conscious, or alert animal. Instead, explicitly describe a deceased pet lying completely motionless with eyes closed, or a grieving human weeping over a pet memorial, photo frame, or empty collar.
2. BREEDS: Be hyper-specific with animal breeds (e.g., "Pekingese" must be explicitly described as a small, long-haired, flat-faced Pekingese).
3. EMOTION & COMPOSITION: Detail cinematic lighting, dramatic human expressions (tears, agony, sorrow), and realistic textures.
4. Output ONLY the final detailed English prompt. No introductions, explanations, or quotes.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      if (gptResponse.choices[0]?.message?.content) {
        finalPrompt = gptResponse.choices[0].message.content.trim();
      }
    } catch (e) {
      console.warn("Falló GPT-4o-mini, usando fallback:", e);
    }

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
      throw new Error("No se obtuvo la imagen");
    }

    // 3. Conversión a Base64
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en la API:", error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}