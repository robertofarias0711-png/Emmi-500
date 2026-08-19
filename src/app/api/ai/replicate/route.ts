// src/app/api/ai/replicate/route.ts
// EMMI_500 - REPLICATE AI ENGINE INTEGRATION

import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, type, prompt, imageUrl } = await req.json();

    // 1. Verificación de créditos en Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    const creditCosts: Record<string, number> = {
      text_to_image: 2,
      edit_image: 3,
      text_to_video: 10,
      image_to_video: 10,
      scene_combo: 12,
    };

    const cost = creditCosts[type] || 2;

    if (!profile || profile.credits_balance < cost) {
      return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 });
    }

    let output: any;

    // 2. Ejecución según el tipo de IA requerida
    if (type === 'text_to_image') {
      output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: { prompt: prompt, aspect_ratio: "16:9" } }
      );
    } else if (type === 'image_to_video' || type === 'text_to_video') {
      output = await replicate.run(
        "stability-ai/stable-video-diffusion:3f0457e4619da6611603259a219638557d2151610c59e4b77c8113c5a2d888b1",
        { input: { input_image: imageUrl, motion_bucket_id: 127 } }
      );
    }

    // 3. Descontar saldo y registrar transacción
    const newBalance = profile.credits_balance - cost;
    await supabase.from('profiles').update({ credits_balance: newBalance }).eq('id', userId);
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -cost,
      description: `Generación IA (${type})`,
    });

    return NextResponse.json({
      success: true,
      resultUrl: output,
      remainingCredits: newBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar con la IA' }, { status: 500 });
  }
}