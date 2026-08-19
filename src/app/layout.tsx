import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emmi_500 AI',
  description: 'Generador de imágenes con IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-950 text-white">{children}</body>
    </html>
  );
}