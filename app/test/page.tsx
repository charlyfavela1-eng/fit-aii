'use client'

import { useState } from 'react'

const PERSON_URL  = 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800&fm=jpg'
const GARMENT_URL = 'https://images.unsplash.com/photo-1562826665-85cdb455ddb1?w=800&fm=jpg'
const PROMPT      = 'Dress the person in this black hoodie. Match the exact color, fabric texture, fit, and style of the reference garment. PRESERVE EXACTLY: the person face, skin tone, hair, body proportions, pose, background. Change ONLY the clothing.'

type Status = 'idle' | 'downloading' | 'submitting' | 'polling' | 'done' | 'error'

interface Prueba {
  id: number
  timestamp: string
  imageUrl: string
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function TestPage() {
  const [status, setStatus]       = useState<Status>('idle')
  const [log, setLog]             = useState<string[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [pruebas, setPruebas]     = useState<Prueba[]>([])
  const [selected, setSelected]   = useState<Prueba | null>(null)

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  async function runTest() {
    setStatus('downloading')
    setLog([])
    setResultUrl(null)
    setError(null)

    try {
      addLog('⬇️  Descargando foto de persona…')
      const personB64 = await urlToBase64(PERSON_URL)
      addLog(`✓ Persona: ${Math.round(personB64.length / 1024)}KB`)

      addLog('⬇️  Descargando foto de prenda…')
      const garmentB64 = await urlToBase64(GARMENT_URL)
      addLog(`✓ Prenda: ${Math.round(garmentB64.length / 1024)}KB`)

      setStatus('submitting')
      addLog('🚀 Enviando a IDM-VTON (fal.ai)…')

      const submitRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: personB64, garmentBase64: garmentB64, prompt: PROMPT }),
      })
      const submitData = await submitRes.json()

      if (!submitRes.ok) throw new Error(submitData.error || `Error ${submitRes.status}`)
      if (submitData.status !== 'pending') throw new Error('Respuesta inesperada')

      addLog(`✓ En cola — ID: ${submitData.predictionId}`)
      setStatus('polling')

      const params = new URLSearchParams({
        statusUrl:   submitData.statusUrl,
        responseUrl: submitData.responseUrl,
      })

      for (let i = 1; i <= 40; i++) {
        await new Promise(r => setTimeout(r, 5000))
        addLog(`⏳ Poll #${i}…`)

        const pollRes  = await fetch(`/api/poll?${params}`)
        const pollData = await pollRes.json()

        if (pollData.status === 'completed' && pollData.imageUrl) {
          const nueva: Prueba = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            imageUrl: pollData.imageUrl,
          }
          setPruebas(prev => [nueva, ...prev])
          setSelected(nueva)
          setResultUrl(pollData.imageUrl)
          setStatus('done')
          addLog('✅ ¡Completado!')
          return
        }
        if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Generación fallida')
        }
      }

      throw new Error('Tiempo de espera agotado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStatus('error')
      addLog('❌ Error: ' + msg)
    }
  }

  const busy = status !== 'idle' && status !== 'done' && status !== 'error'

  const btnLabel =
    status === 'downloading' ? '⬇️ Descargando…' :
    status === 'submitting'  ? '🚀 Enviando…'     :
    status === 'polling'     ? '⏳ Generando…'    :
    '✨ Generar'

  const displayed = selected ?? (pruebas[0] ?? null)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* ── Sidebar izquierdo: Pruebas ── */}
      <aside style={{
        width: 200, minWidth: 200, background: '#111', borderRight: '1px solid #1f1f1f',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '1rem 1rem 0.5rem', borderBottom: '1px solid #1f1f1f' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Pruebas
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {pruebas.length === 0 && (
            <p style={{ fontSize: '0.72rem', color: '#333', padding: '0.5rem', margin: 0 }}>
              Sin resultados aún
            </p>
          )}
          {pruebas.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                display: 'block', width: '100%', padding: 0, border: 'none', background: 'transparent',
                cursor: 'pointer', marginBottom: '0.5rem', borderRadius: 10,
                outline: selected?.id === p.id ? '2px solid #38bdf8' : '2px solid transparent',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={`prueba ${p.id}`}
                style={{ width: '100%', borderRadius: 10, display: 'block', aspectRatio: '3/4', objectFit: 'cover' }}
              />
              <p style={{ fontSize: '0.65rem', color: '#555', margin: '0.2rem 0 0', textAlign: 'center' }}>
                {p.timestamp}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Área principal ── */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panel de generación */}
        <div style={{ width: 340, minWidth: 340, padding: '1.5rem', borderRight: '1px solid #1f1f1f', overflowY: 'auto' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 0.25rem' }}>
            🧪 Test generación
          </h1>
          <p style={{ color: '#555', fontSize: '0.75rem', margin: '0 0 1.25rem' }}>
            IDM-VTON · fal.ai
          </p>

          {/* Input images */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: '#555', margin: '0 0 0.35rem' }}>📸 Persona</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PERSON_URL} alt="persona" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '3/4' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: '#555', margin: '0 0 0.35rem' }}>👕 Prenda</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GARMENT_URL} alt="prenda" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '3/4' }} />
            </div>
          </div>

          {/* Button */}
          <button
            onClick={runTest}
            disabled={busy}
            style={{
              width: '100%', padding: '0.65rem',
              background: busy ? '#1a2a3a' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
              border: 'none', borderRadius: 10, color: busy ? '#38bdf8' : '#fff',
              fontWeight: 700, fontSize: '0.9rem', cursor: busy ? 'default' : 'pointer',
              marginBottom: '1rem',
            }}
          >
            {btnLabel}
          </button>

          {/* Log */}
          {log.length > 0 && (
            <div style={{
              background: '#161616', borderRadius: 8, padding: '0.6rem',
              maxHeight: 180, overflowY: 'auto',
            }}>
              {log.map((l, i) => (
                <p key={i} style={{ margin: '0.15rem 0', fontSize: '0.72rem', color: '#666', fontFamily: 'monospace' }}>{l}</p>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: '1rem', background: '#1a0505', border: '1px solid #5a1a1a', borderRadius: 8, padding: '0.75rem' }}>
              <p style={{ color: '#f87171', fontSize: '0.78rem', margin: 0 }}>❌ {error}</p>
            </div>
          )}
        </div>

        {/* Visor de resultado */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
          {displayed ? (
            <>
              <p style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, marginBottom: '1rem' }}>
                ✅ Resultado generado por IA
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayed.imageUrl}
                alt="resultado"
                style={{ maxWidth: 420, width: '100%', borderRadius: 16, boxShadow: '0 0 60px #38bdf820' }}
              />
              <a
                href={displayed.imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: '0.75rem', color: '#444', fontSize: '0.65rem', wordBreak: 'break-all', textAlign: 'center' }}
              >
                {displayed.imageUrl}
              </a>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#2a2a2a' }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✨</p>
              <p style={{ fontSize: '0.85rem' }}>Genera una prueba para ver el resultado aquí</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
