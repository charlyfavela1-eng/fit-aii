'use client'

import { useRef, useState, useCallback } from 'react'

interface CameraProps {
  onCapture: (base64: string, preview: string) => void
}

// La clienta llega por WhatsApp, y WhatsApp abre los links en su propio
// navegador embebido, donde getUserMedia está bloqueado de fábrica. Ahí la
// cámara NUNCA va a abrir por más permisos que dé: la salida es el input de
// archivo con capture, que sí levanta la cámara nativa del teléfono.
function navegadorEmbebido() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /(FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat|Twitter|TikTok)/i.test(ua)
}

// El error real importa: "no diste permiso" y "tu navegador no puede" se
// arreglan de formas distintas, y el mensaje genérico de antes las mezclaba.
function explica(e: unknown): string {
  const nombre = (e as { name?: string })?.name || ''
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError')
    return 'Bloqueaste el permiso de cámara. Ábrelo en el candado de la barra de direcciones y vuelve a intentar.'
  if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError')
    return 'No encontramos ninguna cámara en este dispositivo.'
  if (nombre === 'NotReadableError')
    return 'Otra aplicación está usando la cámara. Ciérrala y vuelve a intentar.'
  if (nombre === 'OverconstrainedError')
    return 'Tu cámara no acepta ese modo. Prueba con el botón de voltear.'
  return 'Tu navegador no dejó abrir la cámara. Puedes subir una foto en su lugar.'
}

export default function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const archivoRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [loading, setLoading] = useState(false)

  // Subir una foto: sirve de respaldo cuando la cámara está bloqueada y
  // también como camino principal en el navegador de WhatsApp. Con
  // capture="user" el teléfono abre la cámara igual, sólo que la nativa.
  const desdeArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const lector = new FileReader()
    lector.onload = () => {
      const dataUrl = String(lector.result)
      setPreview(dataUrl)
      setError(null)
      onCapture(dataUrl.split(',')[1], dataUrl)
    }
    lector.readAsDataURL(f)
  }

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    setLoading(true)
    try {
      if (stream) stream.getTracks().forEach(t => t.stop())
      // En http:// (y en algunos WebView) mediaDevices ni existe, y llamarlo
      // tira un TypeError que parecía "permiso denegado".
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error('sin mediaDevices'), { name: 'NotSupportedError' })
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      })
      setStream(s)
      setError(null)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        // iOS no arranca solo aunque el video tenga autoPlay: hay que pedirlo,
        // y si el gesto no le gusta se queda en negro sin decir nada.
        videoRef.current.play().catch(() => {})
      }
    } catch (e) {
      setError(explica(e))
    } finally {
      setLoading(false)
    }
  }, [stream])

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    startCamera(next)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    const base64 = dataUrl.split(',')[1]
    setPreview(dataUrl)
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    onCapture(base64, dataUrl)
  }

  const retake = () => {
    setPreview(null)
    startCamera(facing)
  }

  if (preview) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: 400 }}>
          <img src={preview} alt="Tu foto" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-300 text-xs font-semibold">Foto tomada</span>
            </div>
            <button
              onClick={retake}
              className="text-white/70 text-xs underline hover:text-white transition"
            >
              Tomar otra
            </button>
          </div>
        </div>
      </div>
    )
  }

  // El input vive fuera de los returns: los tres estados lo usan y montarlo
  // dos veces perdería el archivo elegido al re-renderizar.
  const inputArchivo = (
    <input
      ref={archivoRef}
      type="file"
      accept="image/*"
      capture="user"
      onChange={desdeArchivo}
      className="hidden"
    />
  )

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-red-900/50 bg-red-950/20">
        <div className="text-4xl">📵</div>
        <p className="text-red-400 text-sm text-center leading-relaxed">{error}</p>
        <button
          onClick={() => archivoRef.current?.click()}
          className="btn-primary w-full py-4 text-base"
        >
          📁 Subir una foto
        </button>
        <button onClick={() => startCamera(facing)} className="glass px-6 py-3 rounded-xl text-sm">
          Reintentar la cámara
        </button>
        {inputArchivo}
      </div>
    )
  }

  if (!stream) {
    const embebido = navegadorEmbebido()
    return (
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl card">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center text-4xl animate-float">
          📸
        </div>
        <div className="text-center">
          <p className="font-bold text-lg mb-1">Tu foto de cuerpo completo</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            {embebido
              ? 'Abriste esto desde otra app, así que la cámara en vivo no funciona aquí. Toma tu foto con el botón de abajo.'
              : 'Necesitamos tu foto para mostrarte cómo te queda la ropa'}
          </p>
        </div>
        {embebido ? (
          <>
            <button
              onClick={() => archivoRef.current?.click()}
              className="btn-primary w-full py-4 text-base"
            >
              📸 Tomar o subir foto
            </button>
            <p className="text-gray-600 text-xs text-center">
              Para la cámara en vivo, abre este link en Chrome o Safari.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => startCamera(facing)}
              disabled={loading}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? 'Conectando...' : 'Activar cámara'}
            </button>
            <button
              onClick={() => archivoRef.current?.click()}
              className="glass w-full py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition"
            >
              📁 O sube una foto
            </button>
          </>
        )}
        <p className="text-gray-600 text-xs text-center">
          Tu foto se procesa de forma privada y no se almacena
        </p>
        {inputArchivo}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: '3/4', maxHeight: 400 }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        {/* Guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-44 h-72 border-2 border-white/30 rounded-full" />
        </div>
        {/* Corner brackets */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-brand-400/70 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-brand-400/70 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-brand-400/70 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-brand-400/70 rounded-br-lg" />
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <p className="text-white/50 text-xs">Párate de frente, cuerpo completo</p>
        </div>
      </div>

      <div className="flex w-full gap-3">
        <button
          onClick={flipCamera}
          className="glass px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition"
        >
          🔄
        </button>
        <button
          onClick={capture}
          className="btn-primary flex-1 py-4 text-base"
        >
          📸 Capturar foto
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
