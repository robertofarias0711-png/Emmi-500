import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    // Recibimos 'prompt' y 'aspect_ratio' del frontend
    const { prompt, aspect_ratio } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    // Usamos 'aspect_ratio' recibido, o '1:1' por defecto si no viene
    const ratioToUse = aspect_ratio || "1:1";

    console.log(`Generando imagen con Prompt: "${prompt}" y Ratio: ${ratioToUse}`);

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: ratioToUse, // <--- CAMBIO AQUÍ
          output_format: "webp",
          output_quality: 80
        }
      }
    );

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("Error en Replicate API:", error);
    return NextResponse.json({ error: error.message || 'Error al generar la imagen' }, { status: 500 });
  }
}