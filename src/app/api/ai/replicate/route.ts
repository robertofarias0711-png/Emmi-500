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

    // 1. Enriquecer el prompt automáticamente para capturar la emoción y narrativa real
    const promptEnhancer = `High quality cinematic image of: ${prompt}. Capture intense emotion, accurate anatomical details, dramatic lighting, highly detailed narrative scene, 8k resolution, realistic textures.`;

    // 2. Generar la imagen en Replicate
    const output: any = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: promptEnhancer,
          num_outputs: 1,
          aspect_ratio: ratioToUse,
          output_format: "webp",
          output_quality: 85,
          disable_safety_checker: true
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;

    // 3. Convertir la imagen a Base64 para permitir la descarga directa local
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    return NextResponse.json({ output: [dataUrl] });

  } catch (error: any) {
    console.error("Error en Replicate API:", error);

    if (error.message && error.message.includes("NSFW")) {
      return NextResponse.json({ 
        error: 'El contenido solicitado fue filtrado por el sistema de seguridad. Intenta modificar algunas palabras.' 
      }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Error al generar la imagen' }, { status: 500 });
  }
}