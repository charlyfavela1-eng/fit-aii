'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Camera from '@/components/Camera'
import CatalogPicker from '@/components/CatalogPicker'
import SizePicker from '@/components/SizePicker'
import FitBadge from '@/components/FitBadge'
import GarmentSearch from '@/components/GarmentSearch'
import { Garment, PersonSize, buildTryOnPrompt, getSizeDiff } from '@/lib/catalog'

type View = 'landing' | 'photo' | 'catalog' | 'generating' | 'result'

const STEPS: { key: View; label: string }[] = [
  { key: 'photo', label: 'Tu foto' },
  { key: 'catalog', label: 'Prenda' },
  { key: 'result', label: 'Resultado' },
]

export default function Home() {
  const [view, setView] = useState<View>('landing')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null)
  const [personSize, setPersonSize] = useState<PersonSize | null>(null)
  const [credits, setCredits] = useState(0)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatingMsg, setGeneratingMsg] = useState(0)
  const [origen, setOrigen] = useState<'internet' | 'catalogo'>('internet')
  const pollRef = useRef<boolean>(false)

  /* El saldo lo manda el servidor y punto. Antes vivia en localStorage, o sea
     que cualquiera se escribia 9999 creditos desde la consola. */
  const refrescarCreditos = useCallback(async () => {
    try {
      const r = await fetch('/api/creditos')
      const d = await r.json()
      if (typeof d.creditos === 'number') setCredits(d.creditos)
    } catch { /* si no responde, se queda el ultimo saldo conocido */ }
  }, [])

  useEffect(() => { refrescarCreditos() }, [refrescarCreditos])

  const loadingMessages = [
    'Analizando tu silueta...',
    'Aplicando la prenda con IA...',
    'Ajustando proporciones y talla...',
    'Añadiendo detalles de iluminación...',
    'Finalizando tu look...',
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

  const handleGenerate = useCallback(async () => {
    if (!photoBase64 || !selectedGarment || !personSize) return

    setView('generating')
    setError(null)
    pollRef.current = false

    const prompt = buildTryOnPrompt(selectedGarment, personSize)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // La foto de la prenda es lo que permite probarse ropa de otras
        // paginas; sin ella el modelo se la inventa a partir del texto.
        body: JSON.stringify({ photoBase64, prompt, garmentImageUrl: selectedGarment.imageUrl }),
      })
      const data = await res.json()

      if (typeof data.creditos === 'number') setCredits(data.creditos)
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      if (data.status === 'completed' && data.imageUrl) {
        setResultImage(data.imageUrl)
        setView('result')
      } else if (data.status === 'pending' && data.predictionId) {
        await pollForResult(data.predictionId)
      } else {
        throw new Error('Respuesta inesperada')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setView('catalog')
      refrescarCreditos()
    }
  }, [photoBase64, selectedGarment, personSize])

  const pollForResult = async (predictionId: string) => {
    pollRef.current = true
    let attempts = 0
    while (pollRef.current && attempts < 40) {
      await new Promise(r => setTimeout(r, 3000))
      attempts++
      try {
        const res = await fetch(`/api/poll?id=${predictionId}`)
        const data = await res.json()
        if (data.status === 'completed' && data.imageUrl) {
          setResultImage(data.imageUrl)
          setView('result')
          return
        }
        if (typeof data.creditos === 'number') setCredits(data.creditos)
        if (data.status === 'failed') throw new Error(data.error || 'Generación fallida')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al obtener resultado')
        setView('catalog')
        refrescarCreditos()
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
    setPhotoBase64(null)
    setPhotoPreview(null)
    setSelectedGarment(null)
    setPersonSize(null)
    setResultImage(null)
    setError(null)
    refrescarCreditos()
  }

  const shareResult = async () => {
    if (!resultImage) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi look en FitAI',
          text: `¡Mira cómo me quedaría el ${selectedGarment?.name}! Probé esta prenda con IA en FitAI`,
          url: window.location.href,
        })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('¡Enlace copiado!')
    }
  }

  const stepIndex = (v: View) => ['photo', 'catalog', 'generating', 'result'].indexOf(v)
  const currentStepIndex = stepIndex(view)

  // ─── LANDING ────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-5 py-4">
          <div className="font-black text-xl text-gradient">FitAI</div>
          <div className="glass px-3 py-1.5 rounded-full text-xs text-gray-400">
            Powered by Nano Banana 2
          </div>
        </nav>

        {/* Hero */}
        <div className="flex flex-col items-center text-center px-6 pt-10 pb-8 flex-1 justify-center">
          {/* Floating emojis */}
          <div className="relative mb-8 w-48 h-48">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-2xl" />
            <div className="absolute top-0 left-8 text-5xl animate-float" style={{ animationDelay: '0s' }}>👗</div>
            <div className="absolute top-8 right-0 text-4xl animate-float" style={{ animationDelay: '0.8s' }}>🧥</div>
            <div className="absolute bottom-8 left-0 text-4xl animate-float" style={{ animationDelay: '1.2s' }}>👕</div>
            <div className="absolute bottom-0 right-8 text-5xl animate-float" style={{ animationDelay: '0.4s' }}>✨</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-3xl animate-pulse-ring">
                📸
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black leading-tight mb-4">
            Pruébate ropa
            <br />
            <span className="text-gradient">con Inteligencia Artificial</span>
          </h1>

          <p className="text-gray-400 text-base leading-relaxed max-w-xs mb-2">
            Tómate una selfie y ve cómo te queda cualquier prenda. La IA respeta tu talla real.
          </p>

          <p className="text-brand-400 text-sm font-semibold mb-10">
            ✓ Sin probador &nbsp;·&nbsp; ✓ Sin filas &nbsp;·&nbsp; ✓ 100% IA
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['Tallas reales', 'Fit preciso', '4K quality', 'Privado'].map(f => (
              <span key={f} className="glass text-gray-300 text-xs px-3 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>

          <button
            onClick={() => setView('photo')}
            className="btn-primary w-full max-w-xs py-5 text-lg mb-4"
          >
            Probar gratis →
          </button>
          <p className="text-gray-600 text-xs">
            1 prueba gratuita · Sin registro
          </p>
        </div>

        {/* How it works */}
        <div className="px-5 pb-12">
          <p className="text-center text-gray-600 text-xs font-semibold uppercase tracking-widest mb-5">
            Cómo funciona
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '📸', title: 'Tu foto', desc: 'Tómate una selfie de cuerpo completo' },
              { icon: '👗', title: 'Elige prenda', desc: 'Selecciona talla y artículo del catálogo' },
              { icon: '✨', title: 'Ver resultado', desc: 'La IA genera cómo te queda en segundos' },
            ].map((item, i) => (
              <div key={i} className="card p-3 flex flex-col items-center text-center gap-2">
                <div className="text-2xl">{item.icon}</div>
                <p className="font-bold text-xs">{item.title}</p>
                <p className="text-gray-500 text-[10px] leading-relaxed">{item.desc}</p>
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
        <header className="flex items-center justify-between px-5 py-4">
          <button onClick={startOver} className="glass p-2 rounded-xl text-gray-400 hover:text-white transition">
            ✕
          </button>
          <span className="font-black text-gradient">FitAI</span>
          <button onClick={shareResult} className="glass px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition">
            Compartir
          </button>
        </header>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-black mb-1">¡Así te vería! ✨</h2>
            {selectedGarment && personSize && (
              <FitBadge garmentSize={selectedGarment.size} personSize={personSize} compact />
            )}
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 font-semibold text-center">Tu foto</p>
              <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                <img src={photoPreview!} alt="Foto original" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-brand-400 font-semibold text-center">Resultado IA</p>
              <div className="rounded-2xl overflow-hidden aspect-[3/4] relative">
                <img src={resultImage} alt="Resultado" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-brand-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  IA ✨
                </div>
              </div>
            </div>
          </div>

          {/* Fit info */}
          {selectedGarment && personSize && (
            <FitBadge garmentSize={selectedGarment.size} personSize={personSize} />
          )}

          {/* Garment card */}
          {selectedGarment && (
            <div className="card p-4 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: selectedGarment.colorHex + '22' }}
              >
                {selectedGarment.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{selectedGarment.name}</p>
                <p className="text-gray-400 text-sm">{selectedGarment.brand} · Talla {selectedGarment.size}</p>
                <p className="text-brand-400 font-bold text-lg mt-0.5">
                  ${selectedGarment.price.toLocaleString('es-MX')} MXN
                </p>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button className="btn-primary w-full py-4 text-base">
              🛍️ Comprar ahora
            </button>
            <div className="grid grid-cols-2 gap-3">
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
              onClick={startOver}
              className="text-gray-500 text-sm py-2 hover:text-gray-300 transition"
            >
              Probar otra prenda →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── MAIN APP FLOW ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-20 px-5 py-3 flex items-center gap-4">
        <button
          onClick={() => view === 'photo' ? setView('landing') : setView('photo')}
          className="text-gray-400 hover:text-white transition text-lg leading-none"
        >
          ←
        </button>
        <div className="flex-1 flex items-center gap-3">
          {STEPS.map((step, i) => {
            const stepVIdx = ['photo', 'catalog', 'result'].indexOf(step.key)
            const curVIdx = ['photo', 'catalog', 'generating', 'result'].indexOf(view)
            const done = curVIdx > stepVIdx
            const active = step.key === view || (step.key === 'catalog' && view === 'generating')
            return (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition ${
                  done ? 'bg-brand-500 text-white' :
                  active ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white' :
                  'bg-white/10 text-gray-600'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block transition ${
                  active ? 'text-white' : done ? 'text-brand-400' : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition ${done ? 'bg-brand-500/50' : 'bg-white/10'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full">
          <span className="text-yellow-400 text-xs">⚡</span>
          <span className="text-white text-xs font-bold">{credits}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-6 pb-10 flex flex-col gap-6">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-900/50 rounded-2xl">
              <span className="text-red-400 text-lg">⚠</span>
              <div>
                <p className="text-red-300 text-sm font-semibold">Ocurrió un error</p>
                <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-400">✕</button>
            </div>
          )}

          {/* PHOTO STEP */}
          {view === 'photo' && (
            <>
              <div>
                <h2 className="text-2xl font-black mb-1">Toma tu foto</h2>
                <p className="text-gray-400 text-sm">Párate de frente, de cuerpo completo si es posible</p>
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

          {/* CATALOG STEP */}
          {view === 'catalog' && (
            <>
              <div>
                <h2 className="text-2xl font-black mb-1">Elige una prenda</h2>
                <p className="text-gray-400 text-sm">Selecciona tu talla y la prenda que quieres probar</p>
              </div>

              <SizePicker value={personSize} onChange={setPersonSize} />

              {/* El sello de talla solo tiene sentido con las prendas del
                  catalogo, que traen medidas. De una foto de internet no se
                  puede saber la talla, y ensenar "Talla perfecta" ahi seria
                  inventarselo. */}
              {selectedGarment && personSize && !selectedGarment.externa && (
                <FitBadge garmentSize={selectedGarment.size} personSize={personSize} />
              )}

              <div className="flex gap-2">
                {([['internet', '🌐 De internet'], ['catalogo', '👗 Catálogo']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setOrigen(id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      origen === id
                        ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white'
                        : 'glass text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {origen === 'internet' ? (
                <GarmentSearch
                  personSize={personSize || 'M'}
                  selected={selectedGarment}
                  onSelect={setSelectedGarment}
                />
              ) : (
                <CatalogPicker selected={selectedGarment} onSelect={setSelectedGarment} />
              )}

              {credits <= 0 ? (
                <div className="card p-5 text-center">
                  <p className="text-2xl mb-2">⚡</p>
                  <p className="font-bold text-lg mb-1">Sin créditos disponibles</p>
                  <p className="text-gray-400 text-sm">Ya usaste tu prueba gratuita</p>
                </div>
              ) : (
                <div className="sticky bottom-5">
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedGarment || !personSize}
                    className="btn-primary w-full py-4 text-base shadow-2xl"
                  >
                    ✨ Generar mi look
                    <span className="ml-2 text-white/60 text-sm">· 1 crédito</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* GENERATING */}
          {view === 'generating' && (
            <div className="flex flex-col items-center gap-8 py-20">
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
                <p className="text-brand-400 text-sm font-medium min-h-[1.25rem] transition-all">
                  {loadingMessages[generatingMsg]}
                </p>
                {selectedGarment && personSize && (() => {
                  const diff = getSizeDiff(selectedGarment.size, personSize)
                  if (diff === 0) return null
                  return (
                    <p className="text-gray-500 text-xs mt-2">
                      Ajustando talla {selectedGarment.size} para alguien de talla {personSize}
                    </p>
                  )
                })()}
                <p className="text-gray-700 text-xs mt-6">Esto puede tomar hasta 30 segundos...</p>
              </div>

              {/* Progress dots */}
              <div className="flex gap-2">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: generatingMsg >= i ? '#0ea5e9' : '#1f2937',
                      transition: 'background 0.5s',
                    }}
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
