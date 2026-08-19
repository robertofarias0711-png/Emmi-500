import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    // Mapear los formatos a las dimensiones nativas de DALL-E 3
    let size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
    if (aspect_ratio === "9:16") {
      size = "1024x1792";
    } else if (aspect_ratio === "16:9") {
      size = "1792x1024";
    }

    // Generar la imagen directamente con DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "standard",
      response_format: "b64_json",
    });

    const base64Data = response.data[0]?.b64_json;

    if (!base64Data) {
      throw new Error("No se pudo obtener la imagen desde DALL-E 3");
    }

    const dataUrl = `data:image/png;base64,${base64Data}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en DALL-E 3 API:", error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la imagen con DALL-E 3' },
      { status: 500 }
    );
  }
}