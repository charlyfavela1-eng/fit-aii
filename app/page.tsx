'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Camera from '@/components/Camera'
import CatalogPicker from '@/components/CatalogPicker'
import SizePicker from '@/components/SizePicker'
import FitBadge from '@/components/FitBadge'
import { Garment, PersonSize, buildTryOnPrompt, getSizeDiff } from '@/lib/catalog'
// PersonSize values for the inline size picker in the selection panel
import { hasCredits, useCredit, getCredits } from '@/lib/credits'

type View = 'landing' | 'photo' | 'catalog' | 'generating' | 'result'

const STEPS = [
  { key: 'photo'   as View, label: 'Foto' },
  { key: 'catalog' as View, label: 'Prenda' },
  { key: 'result'  as View, label: 'Resultado' },
]

export default function Home() {
  const [view, setView]                 = useState<View>('landing')
  const [photoBase64, setPhotoBase64]   = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null)
  const [personSize, setPersonSize]     = useState<PersonSize | null>(null)
  const [garmentBase64, setGarmentBase64]   = useState<string | null>(null)
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null)
  const [garmentUrl, setGarmentUrl]     = useState('')
  const [garmentUrlLoading, setGarmentUrlLoading] = useState(false)
  const [garmentUrlError, setGarmentUrlError] = useState<string | null>(null)
  const [credits, setCredits]           = useState(1)
  const [resultImage, setResultImage]   = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [generatingMsg, setGeneratingMsg] = useState(0)
  const pollRef = useRef<boolean>(false)

  useEffect(() => { setCredits(getCredits()) }, [])

  const loadingMessages = [
    'Analizando tu silueta…',
    'Aplicando la prenda con IA…',
    'Ajustando proporciones y talla…',
    'Añadiendo detalles de iluminación…',
    'Finalizando tu look…',
  ]

  useEffect(() => {
    if (view !== 'generating') return
    const interval = setInterval(() => {
      setGeneratingMsg(m => (m + 1) % loadingMessages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [view])

  const handleCapture = (base64: string, preview: string) => {
    setPhotoBase64(base64)
    setPhotoPreview(preview)
  }

  const handleGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setGarmentPreview(dataUrl)
      setGarmentBase64(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const clearGarmentImage = () => {
    setGarmentBase64(null)
    setGarmentPreview(null)
    setGarmentUrl('')
    setGarmentUrlError(null)
  }

  const loadGarmentFromUrl = async (url: string) => {
    if (!url.trim()) return
    setGarmentUrlLoading(true)
    setGarmentUrlError(null)
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url.trim())}`)
      if (!res.ok) throw new Error('No se pudo cargar la imagen')
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) throw new Error('URL no es una imagen')
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      setGarmentBase64(dataUrl)
      setGarmentPreview(dataUrl)
    } catch (e) {
      setGarmentUrlError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setGarmentUrlLoading(false)
    }
  }

  const handleGenerate = useCallback(async () => {
    if (!photoBase64 || !selectedGarment || !personSize) return
    if (!hasCredits()) { setError('Ya usaste tu crédito gratuito.'); return }

    useCredit()
    setCredits(prev => Math.max(0, prev - 1))
    setView('generating')
    setError(null)
    pollRef.current = false

    const prompt = buildTryOnPrompt(selectedGarment, personSize, !!garmentBase64)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64, prompt, garmentBase64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      if (data.status === 'completed' && data.imageUrl) {
        setResultImage(data.imageUrl)
        setView('result')
      } else if (data.status === 'pending' && data.statusUrl && data.responseUrl) {
        await pollForResult(data.statusUrl, data.responseUrl)
      } else {
        throw new Error('Respuesta inesperada')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setView('catalog')
      setCredits(getCredits())
    }
  }, [photoBase64, selectedGarment, personSize, garmentBase64])

  const pollForResult = async (statusUrl: string, responseUrl: string) => {
    pollRef.current = true
    let attempts = 0
    const params = new URLSearchParams({ statusUrl, responseUrl })
    while (pollRef.current && attempts < 40) {
      await new Promise(r => setTimeout(r, 3000))
      attempts++
      try {
        const res = await fetch(`/api/poll?${params}`)
        const data = await res.json()
        if (data.status === 'completed' && data.imageUrl) {
          setResultImage(data.imageUrl)
          setView('result')
          return
        }
        if (data.status === 'failed') throw new Error(data.error || 'Generación fallida')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al obtener resultado')
        setView('catalog')
        setCredits(getCredits())
        return
      }
    }
    if (pollRef.current) {
      setError('Tiempo de espera agotado. Inténtalo de nuevo.')
      setView('catalog')
    }
  }

  const startOver = () => {
    pollRef.current = false
    setView('photo')
    setPhotoBase64(null); setPhotoPreview(null)
    setSelectedGarment(null); setPersonSize(null)
    setGarmentBase64(null); setGarmentPreview(null)
    setResultImage(null); setError(null)
    setCredits(getCredits())
  }

  const tryAnotherGarment = () => {
    pollRef.current = false
    setSelectedGarment(null)
    setGarmentBase64(null); setGarmentPreview(null)
    setGarmentUrl(''); setGarmentUrlError(null)
    setResultImage(null); setError(null)
    setCredits(getCredits())
    setView('catalog')
  }

  const shareResult = async () => {
    if (!resultImage) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi look en FitAI',
          text: `¡Mira cómo me quedaría el ${selectedGarment?.name}! Probé con IA en FitAI`,
          url: window.location.href,
        })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('¡Enlace copiado!')
    }
  }

  // ─── LANDING ────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-5 py-4 pt-safe">
          <div className="font-black text-xl text-gradient">FitAI</div>
          <div className="glass px-3 py-1.5 rounded-full text-xs text-gray-500">
            Powered by Flux · fal.ai
          </div>
        </nav>

        {/* Hero */}
        <div className="flex flex-col items-center text-center px-5 pt-6 pb-6 flex-1 justify-center">
          {/* Animated icons */}
          <div className="relative mb-8 w-44 h-44">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-3xl" />
            <div className="absolute top-0 left-6 text-5xl animate-float" style={{ animationDelay: '0s' }}>👗</div>
            <div className="absolute top-8 right-0 text-4xl animate-float" style={{ animationDelay: '0.8s' }}>🧥</div>
            <div className="absolute bottom-8 left-0 text-4xl animate-float" style={{ animationDelay: '1.2s' }}>👕</div>
            <div className="absolute bottom-0 right-6 text-5xl animate-float" style={{ animationDelay: '0.4s' }}>✨</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-3xl animate-pulse-ring">
                📸
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black leading-tight mb-3">
            Pruébate ropa
            <br />
            <span className="text-gradient">con Inteligencia Artificial</span>
          </h1>

          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-2">
            Tómate una selfie y ve cómo te queda cualquier prenda. La IA respeta tu talla real.
          </p>

          <p className="text-brand-400 text-sm font-bold mb-8">
            ✓ Sin probador &nbsp;·&nbsp; ✓ Sin filas &nbsp;·&nbsp; ✓ 100% IA
          </p>

          {/* Gender pills */}
          <div className="flex gap-3 mb-8">
            {[
              { emoji: '♀', label: 'Mujer', color: 'from-rose-500 to-purple-500' },
              { emoji: '♂', label: 'Hombre', color: 'from-brand-500 to-accent-500' },
            ].map(g => (
              <div key={g.label} className="glass px-4 py-2 rounded-full flex items-center gap-1.5">
                <span className="text-sm">{g.emoji}</span>
                <span className="text-xs font-semibold text-gray-300">{g.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setView('photo')}
            className="btn-primary w-full max-w-xs py-5 text-lg mb-4"
          >
            Probar gratis →
          </button>
          <p className="text-gray-600 text-xs">1 prueba gratuita · Sin registro</p>
        </div>

        {/* How it works */}
        <div className="px-5 pb-10 pb-safe">
          <p className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest mb-4">
            Cómo funciona
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '📸', title: 'Tu foto', desc: 'Selfie de cuerpo completo' },
              { icon: '👗', title: 'Elige prenda', desc: 'Catálogo o búsqueda web' },
              { icon: '✨', title: 'Resultado', desc: 'IA genera tu look en seg.' },
            ].map((item, i) => (
              <div key={i} className="card p-3 flex flex-col items-center text-center gap-1.5">
                <div className="text-2xl">{item.icon}</div>
                <p className="font-bold text-xs">{item.title}</p>
                <p className="text-gray-600 text-[10px] leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULT VIEW ────────────────────────────────────────────────────────────
  if (view === 'result' && resultImage) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 pt-safe">
          <button
            onClick={tryAnotherGarment}
            className="glass p-2.5 rounded-xl text-gray-400 hover:text-white transition"
          >
            ←
          </button>
          <span className="font-black text-gradient">FitAI</span>
          <button
            onClick={shareResult}
            className="glass px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition"
          >
            📤 Compartir
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pb-safe flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-black mb-1">¡Así te vería! ✨</h2>
            {selectedGarment && personSize && (
              <FitBadge garmentSize={selectedGarment.size} personSize={personSize} compact />
            )}
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-gray-500 font-semibold text-center">Tu foto</p>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <img src={photoPreview!} alt="Original" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-brand-400 font-semibold text-center">Resultado IA</p>
              <div className="rounded-2xl overflow-hidden relative" style={{ aspectRatio: '3/4' }}>
                <img src={resultImage} alt="Resultado" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-brand-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  IA ✨
                </div>
              </div>
            </div>
          </div>

          {/* Fit info */}
          {selectedGarment && personSize && (
            <FitBadge garmentSize={selectedGarment.size} personSize={personSize} />
          )}

          {/* Garment info */}
          {selectedGarment && (
            <div className="card p-4 flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: selectedGarment.colorHex + '22' }}
              >
                {selectedGarment.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-sm">{selectedGarment.name}</p>
                <p className="text-gray-400 text-xs">{selectedGarment.brand} · Talla {selectedGarment.size}</p>
                <p className="text-brand-400 font-bold mt-0.5">
                  ${selectedGarment.price.toLocaleString('es-MX')} MXN
                </p>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            {selectedGarment?.buyUrl && (
              <a
                href={selectedGarment.buyUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full py-4 text-base text-center"
              >
                🛍️ Comprar ahora
              </a>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareResult}
                className="glass py-3 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition"
              >
                📤 Compartir
              </button>
              <a
                href={resultImage}
                download="fitai-look.jpg"
                className="glass py-3 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition text-center"
              >
                ⬇️ Descargar
              </a>
            </div>
            <button
              onClick={tryAnotherGarment}
              className="text-gray-500 text-sm py-2 hover:text-gray-300 transition"
            >
              Probar otra prenda →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── MAIN FLOW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-20 px-4 py-3 pt-safe flex items-center gap-3">
        <button
          onClick={() => view === 'photo' ? setView('landing') : setView('photo')}
          className="text-gray-400 hover:text-white transition text-xl w-8 text-center"
        >
          ←
        </button>

        {/* Step progress */}
        <div className="flex-1 flex items-center gap-2">
          {STEPS.map((step, i) => {
            const doneIdx = ['photo','catalog','generating','result'].indexOf(view)
            const stepIdx = ['photo','catalog','result'].indexOf(step.key)
            const done    = doneIdx > stepIdx
            const active  = step.key === view || (step.key === 'catalog' && view === 'generating')
            return (
              <div key={step.key} className="flex items-center gap-1.5 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                  done   ? 'bg-brand-500 text-white' :
                  active ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg' :
                  'bg-white/10 text-gray-600'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium transition-all ${
                  active ? 'text-white' : done ? 'text-brand-400' : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${done ? 'bg-brand-500/50' : 'bg-white/8'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-1 glass px-2.5 py-1 rounded-full">
          <span className="text-yellow-400 text-xs">⚡</span>
          <span className="text-white text-xs font-bold">{credits}</span>
        </div>
      </header>

      {/* ── FLOATING SELECTION PANEL ─────────────────────────────────────────── */}
      {view === 'catalog' && selectedGarment && (
        <div className="fixed left-0 right-0 z-20 px-3" style={{ bottom: '64px' }}>
          <div
            className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(3,7,18,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {/* Garment row */}
            <div className="flex items-center gap-3 px-3 pt-3 pb-2">
              <div
                className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: selectedGarment.colorHex + '22' }}
              >
                {selectedGarment.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedGarment.image.startsWith('http')
                      ? `/api/proxy-image?url=${encodeURIComponent(selectedGarment.image)}`
                      : selectedGarment.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{selectedGarment.emoji}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{selectedGarment.brand}</p>
                <p className="text-sm font-bold text-white leading-tight truncate">{selectedGarment.name}</p>
                <p className="text-brand-400 text-xs font-bold">${selectedGarment.price.toLocaleString('es-MX')} MXN</p>
              </div>
              <button
                onClick={() => setSelectedGarment(null)}
                className="text-gray-600 hover:text-white p-1.5 transition flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Size row */}
            <div className="px-3 pb-2">
              <p className="text-[10px] text-gray-500 mb-1.5">Tu talla (cm de pecho)</p>
              <div className="grid grid-cols-6 gap-1">
                {([
                  { s: 'XS', cm: '32–34' },
                  { s: 'S',  cm: '34–36' },
                  { s: 'M',  cm: '38–40' },
                  { s: 'L',  cm: '42–44' },
                  { s: 'XL', cm: '46–48' },
                  { s: 'XXL',cm: '50–52' },
                ] as { s: string; cm: string }[]).map(({ s, cm }) => (
                  <button
                    key={s}
                    onClick={() => setPersonSize(s as PersonSize)}
                    className={`flex flex-col items-center py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                      personSize === s
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    style={personSize === s ? {
                      background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                      boxShadow: '0 2px 10px rgba(14,165,233,0.4)',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span>{s}</span>
                    <span className="text-[8px] font-normal opacity-60 leading-none mt-0.5">{cm}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <div className="px-3 pb-3">
              {credits <= 0 ? (
                <p className="text-center text-gray-600 text-xs py-2">Sin créditos disponibles</p>
              ) : !personSize ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="text-gray-500 text-xs">↑ Selecciona tu talla para continuar</span>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  className="btn-primary w-full py-3.5 text-base font-bold"
                >
                  ✨ Generar mi look
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full px-4 py-5 pb-8 flex flex-col gap-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-900/50 rounded-2xl">
              <span className="text-red-400 text-lg">⚠</span>
              <div className="flex-1">
                <p className="text-red-300 text-sm font-semibold">Ocurrió un error</p>
                <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400">✕</button>
            </div>
          )}

          {/* ── PHOTO STEP ── */}
          {view === 'photo' && (
            <>
              <div>
                <h2 className="text-2xl font-black mb-1">Tu foto</h2>
                <p className="text-gray-400 text-sm">Párate de frente, cuerpo completo si es posible</p>
              </div>
              <Camera onCapture={handleCapture} />
              {photoBase64 && (
                <button
                  onClick={() => setView('catalog')}
                  className="btn-primary w-full py-4 text-base"
                >
                  Continuar → Elegir prenda
                </button>
              )}
            </>
          )}

          {/* ── CATALOG STEP ── */}
          {view === 'catalog' && (
            <>
              <div>
                <h2 className="text-2xl font-black mb-0.5">Elige una prenda</h2>
                <p className="text-gray-400 text-sm">Toca una prenda para seleccionarla</p>
              </div>

              <CatalogPicker selected={selectedGarment} onSelect={setSelectedGarment} />

              {/* Extra space when selection panel is visible */}
              {selectedGarment && <div className="h-40" />}
            </>
          )}

          {/* ── GENERATING ── */}
          {view === 'generating' && (
            <div className="flex flex-col items-center gap-8 py-16">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center text-3xl">
                    ✨
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black mb-2">Generando tu look</h2>
                <p className="text-brand-400 text-sm font-medium min-h-5 transition-all">
                  {loadingMessages[generatingMsg]}
                </p>
                {selectedGarment && personSize && (() => {
                  const diff = getSizeDiff(selectedGarment.size, personSize)
                  if (diff === 0) return null
                  return (
                    <p className="text-gray-500 text-xs mt-2">
                      Ajustando talla {selectedGarment.size} para talla {personSize}
                    </p>
                  )
                })()}
                <p className="text-gray-700 text-xs mt-6">Puede tomar hasta 30 segundos…</p>
              </div>
              <div className="flex gap-2">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-500"
                    style={{ background: generatingMsg >= i ? '#0ea5e9' : '#1f2937' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
