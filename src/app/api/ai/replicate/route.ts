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

    // 1. GPT-4o-mini traduce, interpreta emociones y detalla la raza exacta
    let finalPrompt = prompt;
    try {
      const gptResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a world-class prompt engineer for AI image generators (FLUX Dev / DALL-E 3).
Transform the user's short input into an explicit, highly detailed English prompt.
RULES:
1. Translate accurately from Spanish to English.
2. Respect exact animal breeds (e.g., Pekingese must explicitly be described as a small fluffy Pekingese dog with flat face).
3. Capture exact emotional tone (grief, agony, heartbreak, or transformation) without causing anatomical glitches.
4. Output ONLY the final English prompt. No conversational text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
      });

      if (gptResponse.choices[0]?.message?.content) {
        finalPrompt = gptResponse.choices[0].message.content.trim();
      }
    } catch (e) {
      console.warn("Falló GPT, usando fallback:", e);
    }

    // 2. Renderizado en FLUX Dev
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
      throw new Error("No se pudo obtener la imagen");
    }

    // 3. Conversión a Base64 para descarga local directa
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