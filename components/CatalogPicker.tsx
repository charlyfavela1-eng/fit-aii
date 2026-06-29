'use client'

import { useState, useMemo, useRef } from 'react'
import { catalog, catalogMama, Garment } from '@/lib/catalog'
import InternetSearch from './InternetSearch'
import MyCatalog from './MyCatalog'

interface CatalogPickerProps {
  selected: Garment | null
  onSelect: (g: Garment) => void
}

type Tab = 'catalog' | 'search' | 'mycatalog'
type Gender = 'mujer' | 'hombre' | 'mama'

function matchesSearch(g: Garment, q: string) {
  if (!q) return true
  const s = q.toLowerCase()
  return (
    g.name.toLowerCase().includes(s) ||
    g.brand.toLowerCase().includes(s) ||
    g.color.toLowerCase().includes(s) ||
    g.type.toLowerCase().includes(s) ||
    g.description.toLowerCase().includes(s) ||
    g.tags.some(t => t.toLowerCase().includes(s))
  )
}

export default function CatalogPicker({ selected, onSelect }: CatalogPickerProps) {
  const [tab, setTab] = useState<Tab>('catalog')
  const [gender, setGender] = useState<Gender>('mujer')
  const [query, setQuery] = useState('')
  const [mamaExtras, setMamaExtras] = useState<Garment[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const addFromUrl = async (raw: string) => {
    const url = raw.trim()
    if (!url) return
    setUrlLoading(true)
    setUrlError(null)
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error('No se pudo cargar la imagen')
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) throw new Error('El link no es una imagen')
      const newGarment: Garment = {
        id: `mama-custom-${Date.now()}`,
        name: 'Prenda personalizada',
        brand: 'Temu / Amazon',
        size: 'L',
        color: 'Multicolor',
        colorHex: '#C27BA0',
        type: 'prenda',
        category: 'tops',
        description: 'Prenda agregada desde link',
        price: 0,
        emoji: '🛍️',
        image: url,
        buyUrl: url.startsWith('http') ? url : undefined,
        measurements: { chest: 108, waist: 104, length: 68 },
        tags: ['mama', 'temu', 'custom'],
      }
      setMamaExtras(prev => [newGarment, ...prev])
      setUrlInput('')
      if (urlInputRef.current) urlInputRef.current.value = ''
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setUrlLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const base = gender === 'mama' ? [...mamaExtras, ...catalogMama] : catalog
    if (gender === 'mama') return base.filter(g => matchesSearch(g, query))
    return base
      .filter(g => g.tags.includes(gender))
      .filter(g => matchesSearch(g, query))
  }, [gender, query, mamaExtras])

  const sectionA = gender === 'mujer'
    ? filtered.filter(g => g.price <= 499)
    : gender === 'mama'
    ? filtered.filter(g => g.category === 'tops' || g.category === 'bottoms')
    : filtered.filter(g => g.tags.includes('negro') || g.tags.includes('agencia ia'))
  const sectionB = gender === 'mujer'
    ? filtered.filter(g => g.price > 499)
    : gender === 'mama'
    ? filtered.filter(g => g.category === 'dresses' || g.category === 'outerwear')
    : filtered.filter(g => !g.tags.includes('negro') && !g.tags.includes('agencia ia'))

  const sectionALabel = gender === 'mujer' ? '💚 Menos de $500' : gender === 'mama' ? '👕 Blusas y Pantalones' : '⚫ Agencia IA / Negro'
  const sectionBLabel = gender === 'mujer' ? '✦ Selecto $500–$700' : gender === 'mama' ? '👗 Vestidos y Abrigos' : '🌿 Old Money / Natural'

  return (
    <div className="flex flex-col">

      {/* ── Gender selector ────────────────────────────────────────────────── */}
      {tab !== 'mycatalog' && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="grid grid-cols-2 gap-2">
            {(['mujer', 'hombre'] as Gender[]).map(g => (
              <button
                key={g}
                onClick={() => { setGender(g); setQuery('') }}
                className={`relative py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  gender === g ? 'text-white' : 'glass text-gray-500 hover:text-gray-300'
                }`}
                style={gender === g ? {
                  background: g === 'mujer'
                    ? 'linear-gradient(135deg, #f43f5e, #c084fc)'
                    : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                  boxShadow: g === 'mujer'
                    ? '0 4px 20px rgba(244,63,94,0.35)'
                    : '0 4px 20px rgba(14,165,233,0.35)',
                } : {}}
              >
                {g === 'mujer' ? '♀ Mujer' : '♂ Hombre'}
                {gender === g && (
                  <span className="absolute top-1.5 right-2 text-[10px] opacity-70">✓</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setGender('mama'); setQuery('') }}
            className={`relative w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
              gender === 'mama' ? 'text-white' : 'glass text-gray-500 hover:text-gray-300'
            }`}
            style={gender === 'mama' ? {
              background: 'linear-gradient(135deg, #f97316, #ec4899)',
              boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
            } : {}}
          >
            💐 Mamá · Temu
            {gender === 'mama' && (
              <span className="absolute top-1.5 right-2 text-[10px] opacity-70">✓</span>
            )}
          </button>
        </div>
      )}

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      {tab === 'catalog' && (
        <>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none">🔍</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={gender === 'mujer' ? 'Buscar: vestido, blusa, lino…' : gender === 'mama' ? 'Buscar: blusa, cardigan, floral…' : 'Buscar: polo, camisa negra, lino…'}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 text-sm transition"
              >✕</button>
            )}
          </div>

          {gender === 'mama' && (
            <div className="mb-3 flex flex-col gap-2">
              <div className="px-3 py-2.5 rounded-xl text-xs text-orange-300 font-medium"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
                💐 Prendas de <span className="font-bold">Temu</span> · Pega el link de imagen de Amazon para agregar más
              </div>
              <div className="flex gap-2">
                <input
                  ref={urlInputRef}
                  type="url"
                  defaultValue=""
                  onChange={e => { setUrlInput(e.target.value); setUrlError(null) }}
                  onKeyDown={e => e.key === 'Enter' && addFromUrl(urlInput)}
                  placeholder="https://m.media-amazon.com/images/I/..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:border-orange-400/50 transition"
                />
                <button
                  onClick={() => addFromUrl(urlInput)}
                  disabled={urlLoading || !urlInput.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}
                >
                  {urlLoading ? '…' : '+ Add'}
                </button>
              </div>
              {urlError && (
                <p className="text-red-400 text-[10px] px-1">{urlError}</p>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <p className="text-3xl mb-2">🔎</p>
              <p className="text-sm mb-2">Sin resultados</p>
              <button onClick={() => setTab('search')} className="text-brand-400 text-xs underline">
                Buscar en internet →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 animate-fade-in">
              {sectionA.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${gender === 'hombre' ? 'text-slate-300' : gender === 'mama' ? 'text-orange-400' : 'text-green-400'}`}>
                      {sectionALabel}
                    </span>
                    <div className={`flex-1 h-px ${gender === 'hombre' ? 'bg-slate-400/20' : gender === 'mama' ? 'bg-orange-400/20' : 'bg-green-400/20'}`} />
                    <span className="text-[10px] text-gray-600">{sectionA.length} prendas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {sectionA.map((g, i) => (
                      <GarmentCard key={g.id} garment={g} selected={selected} onSelect={onSelect} delay={i * 30} />
                    ))}
                  </div>
                </div>
              )}

              {sectionB.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${gender === 'hombre' ? 'text-amber-600' : gender === 'mama' ? 'text-pink-400' : 'text-amber-400'}`}>
                      {sectionBLabel}
                    </span>
                    <div className={`flex-1 h-px ${gender === 'hombre' ? 'bg-amber-700/20' : gender === 'mama' ? 'bg-pink-400/20' : 'bg-amber-400/20'}`} />
                    <span className="text-[10px] text-gray-600">{sectionB.length} prendas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {sectionB.map((g, i) => (
                      <GarmentCard key={g.id} garment={g} selected={selected} onSelect={onSelect} delay={i * 30} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'search' && (
        <div className="animate-fade-in">
          <InternetSearch selected={selected} onSelect={onSelect} gender={gender} />
        </div>
      )}

      {tab === 'mycatalog' && (
        <div className="animate-fade-in">
          <MyCatalog selected={selected} onSelect={onSelect} />
        </div>
      )}

      {/* ── Bottom nav ─────────────────────────────────────────────────────── */}
      <div className="bottom-nav">
        <div className="flex">
          {([
            { id: 'catalog',   icon: '📋', label: 'Catálogo' },
            { id: 'search',    icon: '🌐', label: 'Buscar' },
            { id: 'mycatalog', icon: '🔖', label: 'Mi catálogo' },
          ] as { id: Tab; icon: string; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all ${
                tab === t.id ? 'text-brand-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className={`text-[10px] font-semibold ${tab === t.id ? 'text-brand-400' : 'text-gray-600'}`}>
                {t.label}
              </span>
              {tab === t.id && (
                <div className="w-4 h-0.5 rounded-full bg-brand-400 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="h-16" />
    </div>
  )
}

// ── Garment card ──────────────────────────────────────────────────────────────
function GarmentCard({
  garment: g,
  selected,
  onSelect,
  delay = 0,
}: {
  garment: Garment
  selected: Garment | null
  onSelect: (g: Garment) => void
  delay?: number
}) {
  const [lightbox, setLightbox] = useState(false)
  const isSelected = selected?.id === g.id

  const imgSrc = g.image
    ? (g.image.startsWith('http')
        ? `/api/proxy-image?url=${encodeURIComponent(g.image)}`
        : g.image)
    : null

  return (
    <>
      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.96)' }}
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>

          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={g.name}
              className="max-w-full max-h-[65vh] object-contain rounded-2xl px-4"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="text-8xl">{g.emoji}</div>
          )}

          <div className="mt-5 text-center px-6">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">{g.brand}</p>
            <p className="text-white font-bold text-lg mt-1 leading-snug">{g.name}</p>
            <p className="text-brand-400 font-bold text-base mt-1">${g.price.toLocaleString('es-MX')} MXN</p>
          </div>

          <div className="flex gap-3 mt-5 px-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { onSelect(g); setLightbox(false) }}
              className="btn-primary flex-1 py-3 text-sm"
            >
              {isSelected ? '✓ Seleccionada' : '✨ Elegir esta prenda'}
            </button>
            {g.buyUrl && (
              <a
                href={g.buyUrl}
                target="_blank"
                rel="noreferrer"
                className="glass px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white transition"
              >
                🛍️
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        className={`relative flex flex-col rounded-2xl overflow-hidden transition-all animate-slide-up ${isSelected ? 'card-selected' : 'card'}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Image area */}
        <div className="relative" style={{ aspectRatio: '3/4', backgroundColor: g.colorHex + '22' }}>
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt={g.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl">{g.emoji}</div>
          )}

          {/* Tap to select */}
          <button
            onClick={() => onSelect(g)}
            className="absolute inset-0 focus:outline-none"
            aria-label={`Seleccionar ${g.name}`}
          />

          {/* Overlay text */}
          <div className="absolute inset-x-0 bottom-0 card-overlay p-2.5 pointer-events-none">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">{g.brand}</p>
            <p className="text-xs text-white font-bold leading-tight line-clamp-2">{g.name}</p>
            <p className="text-brand-400 text-xs font-bold mt-0.5">${g.price.toLocaleString('es-MX')} MXN</p>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {g.tags.includes('temu') && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#f9731622', border: '1px solid #f9731655', color: '#fb923c' }}>
                🛒 Temu
              </span>
            )}
            {g.tags.includes('old money') && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#C4965A22', border: '1px solid #C4965A55', color: '#C4965A' }}>
                Old Money
              </span>
            )}
            {g.tags.includes('hecho en mexico') && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#16a34a22', border: '1px solid #16a34a55', color: '#4ade80' }}>
                🇲🇽 MX
              </span>
            )}
            {g.tags.includes('viral') && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#EC489922', border: '1px solid #EC489955', color: '#F9A8D4' }}>
                📌 Viral
              </span>
            )}
          </div>

          {/* Selected check / size pill */}
          <div className="absolute top-2 right-2">
            {isSelected ? (
              <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center pointer-events-none">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/40 text-white/70 pointer-events-none">
                T. {g.size}
              </span>
            )}
          </div>

          {/* Zoom button */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(true) }}
            className="absolute bottom-10 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Ver imagen grande"
          >
            <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Buy button */}
        {g.buyUrl && (
          <div className="p-2">
            <a
              href={g.buyUrl}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              🛍️ Comprar →
            </a>
          </div>
        )}
      </div>
    </>
  )
}
