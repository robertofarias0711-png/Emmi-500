'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/ai/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      // Replicate devuelve un arreglo de URLs o un string
      const result = Array.isArray(data.output) ? data.output[0] : data.output;
      setImageUrl(result);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🚀 Emmi_500 AI</h1>
        <p style={styles.subtitle}>Transforma tus ideas en Imágenes y Video con Inteligencia Artificial</p>
      </header>

      <section style={styles.card}>
        <form onSubmit={handleGenerate} style={styles.form}>
          <label style={styles.label}>Escribe la descripción de tu imagen:</label>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Un astronauta montando un caballo en Marte, estilo cyber-punk..."
              style={styles.input}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !prompt.trim()} style={styles.button}>
              {loading ? '🎨 Generando...' : 'Generar Imagen'}
            </button>
          </div>
        </form>

        {error && <div style={styles.errorContainer}>❌ {error}</div>}

        {imageUrl && (
          <div style={styles.resultContainer}>
            <h3 style={styles.resultTitle}>✨ Tu Creación está lista:</h3>
            <img src={imageUrl} alt="Resultado de IA" style={styles.image} />
            <a href={imageUrl} target="_blank" download="emmi_500_ai.webp" style={styles.downloadBtn}>
              ⬇️ Descargar Imagen
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 1rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    margin: 0,
  },
  card: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    border: '1px solid #334155',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: {
    fontSize: '0.95rem',
    color: '#cbd5e1',
    fontWeight: '500',
  },
  inputGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1',
    minWidth: '240px',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '0.85rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#450a0a',
    border: '1px solid #991b1b',
    borderRadius: '8px',
    color: '#fca5a5',
  },
  resultContainer: {
    marginTop: '2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  resultTitle: {
    fontSize: '1.2rem',
    color: '#38bdf8',
    margin: 0,
  },
  image: {
    width: '100%',
    maxHeight: '450px',
    objectFit: 'contain',
    borderRadius: '12px',
    border: '1px solid #475569',
  },
  downloadBtn: {
    display: 'inline-block',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
};