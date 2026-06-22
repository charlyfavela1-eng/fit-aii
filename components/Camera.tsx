'use client'

import { useRef, useState, useCallback } from 'react'

interface CameraProps {
  onCapture: (base64: string) => void
}

export default function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      })
      setStream(s)
      setError(null)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
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
    onCapture(base64)
  }

  const retake = () => {
    setPreview(null)
    startCamera(facing)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 rounded-2xl">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button
          onClick={() => startCamera(facing)}
          className="px-6 py-3 bg-sky-600 rounded-xl font-semibold hover:bg-sky-500 transition"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden">
          <img src={preview} alt="Tu foto" className="w-full object-cover" />
          <div className="absolute top-3 left-3 bg-green-500 text-xs font-bold px-2 py-1 rounded-full">
            ✓ Foto tomada
          </div>
        </div>
        <button
          onClick={retake}
          className="px-5 py-2 bg-gray-700 rounded-xl text-sm hover:bg-gray-600 transition"
        >
          Tomar otra foto
        </button>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700">
        <div className="text-6xl">📷</div>
        <p className="text-gray-400 text-center text-sm">
          Necesitamos acceso a tu cámara para mostrarte cómo te queda la ropa
        </p>
        <button
          onClick={() => startCamera(facing)}
          className="px-8 py-3 bg-sky-600 rounded-xl font-bold text-lg hover:bg-sky-500 transition"
        >
          Activar cámara
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <div className="absolute inset-0 border-4 border-sky-500/30 rounded-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-80 border-2 border-white/40 rounded-full pointer-events-none" />
      </div>

      <div className="flex gap-3">
        <button
          onClick={flipCamera}
          className="px-4 py-3 bg-gray-700 rounded-xl text-sm hover:bg-gray-600 transition"
        >
          🔄 Cambiar cámara
        </button>
        <button
          onClick={capture}
          className="px-8 py-3 bg-sky-600 rounded-xl font-bold text-lg hover:bg-sky-500 active:scale-95 transition"
        >
          📸 Tomar foto
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
