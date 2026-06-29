'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface CameraProps {
  onCapture: (base64: string, preview: string) => void
}

export default function Camera({ onCapture }: CameraProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const selfieRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [stream,    setStream]    = useState<MediaStream | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [facing,    setFacing]    = useState<'user' | 'environment'>('user')
  const [loading,   setLoading]   = useState(false)
  const [mode,      setMode]      = useState<'choose' | 'stream'>('choose')
  const [isMobile,  setIsMobile]  = useState(false)
  const [hasGetUM,  setHasGetUM]  = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsMobile(touch)
    setHasGetUM(!!(navigator.mediaDevices?.getUserMedia))
  }, [])

  // ── Image processing (shared between file and stream capture) ───────────────
  const processDataUrl = useCallback((dataUrl: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 1080
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
        else { width = Math.round(width * maxDim / height); height = maxDim }
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const resized = canvas.toDataURL('image/jpeg', 0.88)
      setPreview(resized)
      setError(null)
      onCapture(resized.split(',')[1], resized)
    }
    img.src = dataUrl
  }, [onCapture])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagen muy grande (máx 10 MB). Elige otra.')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      if (url) processDataUrl(url)
    }
    reader.readAsDataURL(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }, [processDataUrl])

  // ── getUserMedia stream (desktop / power users) ────────────────────────────
  const startStream = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    setLoading(true)
    setMode('stream')
    try {
      if (stream) stream.getTracks().forEach(t => t.stop())
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      })
      setStream(s)
      setError(null)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
      }
    } catch {
      setError('No se pudo acceder a la cámara. Usa "Tomar selfie" o "Galería".')
      setMode('choose')
    } finally {
      setLoading(false)
    }
  }, [stream])

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    startStream(next)
  }

  const captureStream = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    processDataUrl(dataUrl)
  }

  const startCountdown = () => {
    setCountdown(3)
    let n = 3
    const tick = setInterval(() => {
      n -= 1
      if (n === 0) {
        clearInterval(tick)
        setCountdown(null)
        captureStream()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  const stopStream = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setMode('choose')
  }

  const retake = () => {
    setPreview(null)
    setMode('choose')
    setError(null)
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: 400 }}>
          <img src={preview} alt="Tu foto" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-300 text-xs font-semibold">Foto lista ✓</span>
            </div>
            <button onClick={retake} className="text-white/70 text-xs underline hover:text-white transition">
              Cambiar
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-red-900/50 bg-red-950/20">
        <div className="text-3xl">📵</div>
        <p className="text-red-400 text-sm text-center leading-relaxed">{error}</p>
        <button onClick={() => setError(null)} className="btn-primary px-6 py-2.5 text-sm">
          Volver
        </button>
      </div>
    )
  }

  // ── getUserMedia stream (desktop) ─────────────────────────────────────────
  if (mode === 'stream') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '3/4', maxHeight: 420 }}>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-10 h-10 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
            </div>
          )}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span
                key={countdown}
                className="text-white font-black select-none"
                style={{ fontSize: 120, lineHeight: 1, textShadow: '0 0 40px rgba(14,165,233,0.8)', animation: 'ping-once 0.9s ease-out' }}
              >
                {countdown}
              </span>
            </div>
          )}
          {/* Guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-72 border-2 border-white/25 rounded-full" />
          </div>
          <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-brand-400/60 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-brand-400/60 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-brand-400/60 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-brand-400/60 rounded-br-lg" />
          <p className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-[11px]">
            Cuerpo completo · de frente
          </p>
        </div>
        <div className="flex w-full gap-3">
          <button onClick={flipCamera} disabled={countdown !== null} className="glass px-4 py-3.5 rounded-xl text-lg disabled:opacity-40">🔄</button>
          <button
            onClick={startCountdown}
            disabled={countdown !== null}
            className="btn-primary flex-1 py-3.5 text-base disabled:opacity-60"
          >
            {countdown !== null ? `📸 ${countdown}…` : '📸 Capturar'}
          </button>
          <button onClick={stopStream} disabled={countdown !== null} className="glass px-4 py-3.5 rounded-xl text-sm text-gray-500 disabled:opacity-40">✕</button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // ── Chooser ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* ── MOBILE: native camera inputs (most reliable on iOS/Android) ─────── */}
      {isMobile && (
        <>
          {/* Selfie / front camera */}
          <label className="flex items-center gap-4 card p-5 text-left hover:bg-white/5 active:scale-[0.98] transition cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-2xl flex-shrink-0">
              🤳
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Tomar selfie</p>
              <p className="text-gray-500 text-xs mt-0.5">Cámara frontal — ideal para prueba</p>
            </div>
            <span className="text-gray-600 text-lg">›</span>
            <input
              ref={selfieRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          {/* Back camera / gallery */}
          <label className="flex items-center gap-4 card p-5 text-left hover:bg-white/5 active:scale-[0.98] transition cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center text-2xl flex-shrink-0">
              📷
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Cámara trasera o galería</p>
              <p className="text-gray-500 text-xs mt-0.5">Foto de cuerpo completo · JPG, HEIC</p>
            </div>
            <span className="text-gray-600 text-lg">›</span>
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        </>
      )}

      {/* ── DESKTOP: file upload + live stream camera ──────────────────────── */}
      {!isMobile && (
        <>
          {hasGetUM && (
            <button
              onClick={() => startStream(facing)}
              disabled={loading}
              className="flex items-center gap-4 card p-5 text-left hover:bg-white/5 transition w-full disabled:opacity-60"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                {loading ? '⏳' : '🎥'}
              </div>
              <div>
                <p className="font-bold text-sm">Usar cámara en vivo</p>
                <p className="text-gray-500 text-xs mt-0.5">Vista previa en tiempo real</p>
              </div>
            </button>
          )}

          <label className="flex items-center gap-4 card p-5 text-left hover:bg-white/5 transition cursor-pointer w-full">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center text-2xl flex-shrink-0">
              🖼️
            </div>
            <div>
              <p className="font-bold text-sm">Subir foto desde archivo</p>
              <p className="text-gray-500 text-xs mt-0.5">JPG, PNG · máx 10 MB</p>
            </div>
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <p className="text-gray-700 text-xs text-center pt-1">
        🔒 Tu foto se procesa de forma privada y no se almacena
      </p>
    </div>
  )
}
