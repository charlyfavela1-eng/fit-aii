'use client'

import { useState, useEffect, useCallback } from 'react'
import Camera from '@/components/Camera'
import CatalogPicker from '@/components/CatalogPicker'
import SizePicker from '@/components/SizePicker'
import FitBadge from '@/components/FitBadge'
import { Garment, PersonSize, buildTryOnPrompt } from '@/lib/catalog'
import { hasCredits, useCredit, getCredits } from '@/lib/credits'

type Step = 'photo' | 'catalog' | 'generating' | 'result'

export default function Home() {
  const [step, setStep] = useState<Step>('photo')
  const [photo, setPhoto] = useState<string | null>(null)
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null)
  const [personSize, setPersonSize] = useState<PersonSize | null>(null)
  const [credits, setCredits] = useState(1)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollId, setPollId] = useState<string | null>(null)

  useEffect(() => {
    setCredits(getCredits())
  }, [])

  const handleCapture = (base64: string) => {
    setPhoto(base64)
  }

  const handleGenerate = useCallback(async () => {
    if (!photo || !selectedGarment || !personSize) return
    if (!hasCredits()) {
      setError('No tienes créditos disponibles.')
      return
    }

    useCredit()
    setCredits(prev => Math.max(0, prev - 1))
    setStep('generating')
    setError(null)

    const prompt = buildTryOnPrompt(selectedGarment, personSize)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: photo, prompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar la imagen')
      }

      if (data.status === 'completed' && data.imageUrl) {
        setResultImage(data.imageUrl)
        setStep('result')
      } else if (data.status === 'pending' && data.predictionId) {
        setPollId(data.predictionId)
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setStep('catalog')
      setCredits(getCredits())
    }
  }, [photo, selectedGarment, personSize])

  useEffect(() => {
    if (!pollId) return
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      while (!cancelled && attempts < 40) {
        await new Promise(r => setTimeout(r, 3000))
        attempts++
        try {
          const res = await fetch(`/api/poll?id=${pollId}`)
          const data = await res.json()
          if (data.status === 'completed' && data.imageUrl) {
            if (!cancelled) {
              setResultImage(data.imageUrl)
              setStep('result')
              setPollId(null)
            }
            return
          }
          if (data.status === 'failed') {
            throw new Error(data.error || 'Generación fallida')
          }
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Error al obtener resultado')
            setStep('catalog')
            setPollId(null)
          }
          return
        }
      }
      if (!cancelled) {
        setError('Tiempo de espera agotado. Inténtalo de nuevo.')
        setStep('catalog')
        setPollId(null)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [pollId])

  const reset = () => {
    setStep('photo')
    setPhoto(null)
    setSelectedGarment(null)
    setPersonSize(null)
    setResultImage(null)
    setError(null)
    setCredits(getCredits())
  }

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">FitAI</h1>
          <p className="text-gray-500 text-xs">Pruébate ropa con IA</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700">
          <span className="text-yellow-400 text-sm">⚡</span>
          <span className="text-sm font-bold">{credits}</span>
          <span className="text-gray-500 text-xs">crédito{credits !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 pb-24">

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {(['photo', 'catalog', 'result'] as const).map((s, i) => {
            const stepIndex = ['photo', 'catalog', 'generating', 'result'].indexOf(step)
            const thisIndex = i
            const done = stepIndex > thisIndex || (s === 'result' && step === 'result')
            const active = s === step || (s === 'catalog' && step === 'generating')
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  done ? 'bg-sky-600' : active ? 'bg-sky-600 ring-2 ring-sky-400' : 'bg-gray-800 text-gray-500'
                }`}>
                  {done && thisIndex < ['photo', 'catalog', 'result'].indexOf(step) ? '✓' : i + 1}
                </div>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {s === 'photo' ? 'Tu foto' : s === 'catalog' ? 'Elige prenda' : 'Resultado'}
                </p>
                {i < 2 && <div className="flex-1 h-px bg-gray-800 ml-2" />}
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-950 border border-red-800 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: Photo */}
        {step === 'photo' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black mb-1">Tu foto</h2>
              <p className="text-gray-400 text-sm">Párate de frente, de cuerpo completo si es posible</p>
            </div>
            <Camera onCapture={handleCapture} />
            {photo && (
              <button
                onClick={() => setStep('catalog')}
                className="w-full py-4 bg-sky-600 hover:bg-sky-500 rounded-2xl font-bold text-lg transition active:scale-95"
              >
                Continuar → Elegir prenda
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Catalog + Size */}
        {step === 'catalog' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black mb-1">Elige una prenda</h2>
              <p className="text-gray-400 text-sm">Selecciona qué quieres probarte</p>
            </div>

            <SizePicker value={personSize} onChange={setPersonSize} />

            {selectedGarment && personSize && (
              <FitBadge garmentSize={selectedGarment.size} personSize={personSize} />
            )}

            <CatalogPicker selected={selectedGarment} onSelect={setSelectedGarment} />

            {credits <= 0 ? (
              <div className="p-4 bg-yellow-950 border border-yellow-800 rounded-2xl text-center">
                <p className="text-yellow-300 font-bold">Sin créditos disponibles</p>
                <p className="text-yellow-600 text-sm mt-1">Ya usaste tu prueba gratuita</p>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!selectedGarment || !personSize}
                className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-lg transition active:scale-95"
              >
                ✨ Generar prueba (1 crédito)
              </button>
            )}
          </div>
        )}

        {/* STEP 3: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center gap-8 py-16">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-sky-800 border-t-sky-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2">Generando tu look</h2>
              <p className="text-gray-400 text-sm">
                La IA está vistiéndote con {selectedGarment?.name}
                {selectedGarment && personSize && selectedGarment.size !== personSize
                  ? ` (talla ${selectedGarment.size} sobre tu talla ${personSize})`
                  : ''}
              </p>
              <p className="text-gray-600 text-xs mt-3">Esto puede tomar 15-30 segundos...</p>
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === 'result' && resultImage && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black mb-1">¡Así te vería!</h2>
              {selectedGarment && personSize && (
                <FitBadge garmentSize={selectedGarment.size} personSize={personSize} />
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-700">
              <img src={resultImage} alt="Resultado" className="w-full object-cover" />
            </div>

            {selectedGarment && (
              <div className="bg-gray-900 rounded-2xl p-4 flex items-start gap-3">
                <div className="text-3xl">
                  {selectedGarment.type === 'hoodie' ? '🧥' :
                   selectedGarment.type === 'camiseta' ? '👕' :
                   selectedGarment.type === 'chamarra' ? '🥼' :
                   selectedGarment.type === 'vestido' ? '👗' : '👔'}
                </div>
                <div>
                  <p className="font-bold">{selectedGarment.name}</p>
                  <p className="text-gray-400 text-sm">{selectedGarment.brand} • Talla {selectedGarment.size} • {selectedGarment.color}</p>
                  {selectedGarment.measurements.chest && (
                    <p className="text-gray-600 text-xs mt-1">
                      Pecho: {selectedGarment.measurements.chest}cm
                      {selectedGarment.measurements.waist ? ` · Cintura: ${selectedGarment.measurements.waist}cm` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl font-bold transition"
              >
                Probar otro look
              </button>
              <a
                href={resultImage}
                download="fitai-resultado.jpg"
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 rounded-2xl font-bold text-center transition"
              >
                Descargar
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
