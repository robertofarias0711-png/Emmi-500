
import './globals.css';
import type { Metadata } from 'next';

export const metadata = {
  title: 'Emmi 500',
  description: 'Plataforma de IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}