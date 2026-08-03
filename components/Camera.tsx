'use client'

import { useRef, useState, useCallback } from 'react'

interface CameraProps {
  onCapture: (base64: string, preview: string) => void
}

export default function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [loading, setLoading] = useState(false)

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    setLoading(true)
    try {
      if (stream) stream.getTracks().forEach(t => t.stop())

      // getUserMedia solo existe en contexto seguro. Servida por http:// (que no sea
      // localhost) el navegador ni siquiera define mediaDevices, y el catch de abajo
      // reportaba "verifica los permisos" — un mensaje que manda al usuario a buscar
      // un permiso que nunca se le pidio.
      if (!window.isSecureContext) {
        throw new DOMException('inseguro', 'SecurityError')
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException('no soportado', 'NotSupportedError')
      }

      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      })
      setStream(s)
      setError(null)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (e) {
      // Cada causa manda al usuario a un lugar distinto: decirle "revisa permisos"
      // cuando el problema es que la pagina no va por HTTPS lo deja atorado.
      const nombre = e instanceof DOMException ? e.name : ''
      const porNombre: Record<string, string> = {
        SecurityError: 'Esta página no va por HTTPS y el navegador no permite abrir la cámara. Usa el botón de abajo para tomar la foto.',
        NotSupportedError: 'Este navegador no permite abrir la cámara aquí. Usa el botón de abajo para tomarla.',
        NotAllowedError: 'Bloqueaste el permiso de la cámara. Puedes darlo desde el candado de la barra de direcciones, o usar el botón de abajo.',
        NotFoundError: 'No encontramos ninguna cámara en este dispositivo. Sube una foto con el botón de abajo.',
        NotReadableError: 'Otra aplicación está usando la cámara. Ciérrala y reintenta, o usa el botón de abajo.',
      }
      setError(porNombre[nombre] || 'No se pudo abrir la cámara. Usa el botón de abajo para tomar o subir la foto.')
    } finally {
      setLoading(false)
    }
  }, [stream])

  /** Camino alterno: el input de archivo con `capture` abre la cámara nativa del
   *  celular. Funciona sin HTTPS y sin pedir permiso de sitio, así que es la red de
   *  seguridad cuando getUserMedia no está disponible. */
  const desdeArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Ese archivo no es una imagen.')
      return
    }
    const lector = new FileReader()
    lector.onload = () => {
      const dataUrl = String(lector.result)
      setPreview(dataUrl)
      setError(null)
      stream?.getTracks().forEach(t => t.stop())
      setStream(null)
      onCapture(dataUrl.split(',')[1], dataUrl)
    }
    lector.readAsDataURL(f)
  }

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

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-red-900/50 bg-red-950/20">
        <div className="text-4xl">📵</div>
        <p className="text-red-400 text-sm text-center leading-relaxed">{error}</p>
        <label className="btn-primary w-full py-4 text-base text-center cursor-pointer">
          📸 Tomar o subir foto
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={desdeArchivo}
            className="hidden"
          />
        </label>
        <button
          onClick={() => startCamera(facing)}
          className="text-gray-400 text-xs underline hover:text-white transition"
        >
          Reintentar con la cámara del navegador
        </button>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl card">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center text-4xl animate-float">
          📸
        </div>
        <div className="text-center">
          <p className="font-bold text-lg mb-1">Activa tu cámara</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Necesitamos acceder a tu cámara para mostrarte cómo te queda la ropa
          </p>
        </div>
        <button
          onClick={() => startCamera(facing)}
          disabled={loading}
          className="btn-primary w-full py-4 text-base"
        >
          {loading ? 'Conectando...' : 'Activar cámara'}
        </button>
        <label className="w-full py-3 text-sm text-center cursor-pointer glass rounded-xl hover:bg-white/10 transition">
          o toma la foto con tu cámara normal
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={desdeArchivo}
            className="hidden"
          />
        </label>
        <p className="text-gray-600 text-xs text-center">
          Tu foto se procesa de forma privada y no se almacena
        </p>
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
