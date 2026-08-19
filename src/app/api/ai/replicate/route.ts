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

    // 1. Probar la llamada a GPT-4o-mini
    let finalPrompt = '';
    try {
      const gptResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer for AI image generators.
Convert the user request into an explicit, highly detailed English prompt.
CRITICAL RULES:
1. If the user mentions death/grief of a dog, DO NOT output a living dog. Describe a grieving man weeping, holding an empty collar, an urn, or a framed photo of a fluffy Pekingese dog.
2. Ensure exact dog breeds (Pekingese: small, flat-faced, long fluffy fur).
3. Output ONLY the English prompt string.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      });

      finalPrompt = gptResponse.choices[0]?.message?.content?.trim() || '';
    } catch (openAiError: any) {
      // Si falla OpenAI, devolvemos el error directo para corregirlo
      return NextResponse.json({ 
        error: `Error en OpenAI Key: ${openAiError.message || 'Revisa OPENAI_API_KEY en Netlify'}` 
      }, { status: 500 });
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

    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error general:", error);
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: 500 }
    );
  }
}