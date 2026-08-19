import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type || 'image/webp');
    headers.set('Content-Disposition', `attachment; filename="emmi500-${Date.now()}.webp"`);

    return new NextResponse(blob, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: 'Error al descargar la imagen' }, { status: 500 });
  }
}