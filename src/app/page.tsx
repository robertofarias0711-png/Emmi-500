'use client';

import { useState } from 'react';

const aspectRatios = [
  { name: 'Cuadrado (1:1)', value: '1:1', icon: '⏹️' },
  { name: 'Vertical (9:16)', value: '9:16', icon: '📱' },
  { name: 'Horizontal (16:9)', value: '16:9', icon: '📺' },
];

const styles = [
  { name: 'Predeterminado', value: '' },
  { name: 'Fotorrealismo', value: ', photorealistic, 8k, highly detailed, cinematic lighting' },
  { name: 'Anime', value: ', anime style, vibrant colors, detailed line art, studio ghibli style' },
  { name: 'Arte Digital', value: ', digital art, concept art, trend on artstation, sharp focus' },
  { name: 'Cyberpunk', value: ', cyberpunk style, neon lights, futuristic city, dark atmosphere' },
  { name: 'Van Gogh', value: ', oil painting style, Vincent van Gogh style, impasto, swirling brushstrokes' },
];

const examplePrompts = [
  "Un gato astronauta flotando en el espacio, hiperdetallado.",
  "Un bosque místico con hongos luminosos a medianoche.",
  "Un samurái robot en una ciudad cyberpunk futurista.",
  "Un retrato de una mujer con cabello de fuego, estilo óleo.",
  "Un dragón de hielo sobre una montaña nevada, 8k."
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    setLoading(true);
    setGeneratedImage(null);
    setError(null);

    const finalPrompt = prompt + style;

    try {
      const response = await fetch('/api/ai/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: finalPrompt, 
          aspect_ratio: aspectRatio
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedImage(data.output[0]);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setPrompt(randomPrompt);
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    setDownloading(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = generatedImage;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `emmi500-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setDownloading(false);
      };

      img.onerror = () => {
        window.open(generatedImage, '_blank');
        setDownloading(false);
      };
    } catch {
      window.open(generatedImage, '_blank');
      setDownloading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-950 text-white">
      {/* Header */}
      <header className="w-full max-w-7xl flex items-center justify-between pb-8 border-b border-gray-800 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">E</div>
          <h1 className="text-3xl font-bold tracking-tighter">Emmi_500 <span className="text-blue-500">AI</span></h1>
        </div>
        <p className="text-gray-400 text-sm hidden md:block">Transforma tus ideas en Imágenes con IA</p>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        {/* Panel de Control */}
        <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
          <label className="block text-lg font-medium mb-3 text-gray-200">Escribe la descripción de tu imagen:</label>
          
          <div className="relative mb-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Un astronauta montando un caballo en Marte..."
              className="w-full p-4 pr-32 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none"
            />
            <button 
              onClick={handleSurpriseMe}
              className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium text-gray-200 transition-colors"
            >
              ✨ Sorpréndeme
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Selector de Formato */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">1. Elige el Formato</label>
              <div className="grid grid-cols-3 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      aspectRatio === ratio.value
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl mb-1">{ratio.icon}</span>
                    <span className="text-xs font-medium">{ratio.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Estilo */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">2. Elige el Estilo</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-3 h-[74px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {styles.map((s) => (
                  <option key={s.name} value={s.value}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón Generar */}
          <button
            onClick={generateImage}
            disabled={loading || !prompt}
            className={`w-full p-4 rounded-xl text-lg font-semibold transition-all ${
              loading || !prompt
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-4 border-gray-300 border-t-white rounded-full animate-spin"></span>
                Generando...
              </span>
            ) : (
              '🚀 Generar Imagen'
            )}
          </button>
        </section>

        {/* Panel de Resultado */}
        <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl min-h-[300px] flex flex-col items-center justify-center">
          {loading && (
            <div className="text-center text-gray-400 flex flex-col items-center gap-4">
              <span className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></span>
              <p>Replicate está creando tu obra de arte...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl text-center w-full">
              <p className="font-bold">🚨 Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !generatedImage && !error && (
            <div className="text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl p-10 w-full">
              <p className="text-5xl mb-4">🖼️</p>
              <p>Tu creación aparecerá aquí</p>
              <p className="text-sm">Configura tu prompt arriba y dale a Generar.</p>
            </div>
          )}

          {generatedImage && (
            <div className="w-full flex flex-col items-center gap-4">
              <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                ✨ Tu Creación está lista:
              </h2>
              <div className="relative rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl bg-black flex items-center justify-center">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="max-w-full h-auto object-contain rounded-lg"
                />
              </div>
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white transition-colors flex items-center gap-2 disabled:bg-gray-700"
              >
                {downloading ? 'Descargando...' : '⬇️ Descargar Imagen'}
              </button>
            </div>
          )}
        </section>

      </div>

      <footer className="w-full max-w-7xl mt-16 pt-8 border-t border-gray-800 text-center text-gray-600 text-sm">
        Emmi_500 AI © {new Date().getFullYear()} - Todos los derechos reservados.
      </footer>
    </main>
  );
}