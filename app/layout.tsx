import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitAI — Pruébate ropa con Inteligencia Artificial',
  description: 'Tómate una selfie y pruébate cualquier prenda del catálogo. La IA te muestra cómo te quedaría, respetando tu talla real.',
  keywords: ['moda', 'probador virtual', 'inteligencia artificial', 'ropa', 'tallas', 'virtual try-on'],
  openGraph: {
    title: 'FitAI — Pruébate ropa con IA',
    description: 'Pruébate ropa desde tu celular. Sin probador, sin filas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitAI — Pruébate ropa con IA',
    description: 'Pruébate ropa desde tu celular. Sin probador, sin filas.',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#030712',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
