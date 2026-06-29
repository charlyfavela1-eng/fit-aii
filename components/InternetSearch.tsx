'use client'

import { useState, useCallback } from 'react'
import { Garment } from '@/lib/catalog'
import { saveItem, isItemSaved, getSavedItems } from '@/lib/my-catalog'

interface SearchResult {
  title: string
  brand: string
  price: string
  priceNum: number
  imageUrl: string
  buyUrl: string
  source: string
  isProductUrl: boolean
}

interface InternetSearchProps {
  onSelect: (g: Garment) => void
  selected: Garment | null
  gender: 'mujer' | 'hombre' | 'mama'
}

const CHIPS: Record<'mujer' | 'hombre' | 'mama', string[]> = {
  mujer: [
    'vestido midi casual',
    'vestido floral mujer',
    'blusa elegante',
    'conjunto pantalón wide leg',
    'vestido lino mujer',
    'top off shoulder',
    'blazer mujer elegante',
  ],
  hombre: [
    'polo negro minimalista',
    'camisa negra slim fit',
    'mock neck negro hombre',
    'polo lino blanco old money',
    'camisa oversize negra',
    'camisa lino negro hombre',
    'polo piqué negro',
  ],
  mama: [
    'blusa floral mujer madura',
    'vestido casual señora',
    'conjunto cómodo mujer',
    'blusa bordada mexicana',
    'cardigan suave mujer',
    'pantalón elástico mujer',
    'vestido floral manga corta',
  ],
}

let resultId = 0

export default function InternetSearch({ onSelect, selected, gender }: InternetSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [provider, setProvider] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(getSavedItems().map(i => i.id)))
  const [onlyProducts, setOnlyProducts] = useState(true)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    setError(null)
    setSearched(true)
    setResults([])

    try {
      const res = await fetch(`/api/search-garments?q=${encodeURIComponent(q)}&gender=${gender}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al buscar')
      setResults(data.results ?? [])
      setProvider(data.provider ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }, [gender])

  const selectResult = (item: SearchResult) => {
    const g: Garment = {
      id: `search-${resultId++}`,
      name: item.title.slice(0, 60),
      brand: item.brand || item.source,
      size: 'M',
      color: '',
      colorHex: '#888888',
      type: query,
      category: gender === 'mujer' ? 'dresses' : 'tops',
      description: item.title,
      price: item.priceNum,
      emoji: '🔍',
      image: item.imageUrl,
      buyUrl: item.buyUrl,
      measurements: { chest: 108, waist: 104, length: 72 },
      tags: ['busqueda internet', gender, query.toLowerCase()],
    }
    onSelect(g)
  }

  const handleSave = (item: SearchResult) => {
    const id = `saved-${item.buyUrl}`
    saveItem({
      id,
      name: item.title.slice(0, 80),
      brand: item.brand || item.source,
      image: item.imageUrl,  // SearchResult uses imageUrl, SavedItem uses image
      price: item.price,
      priceNum: item.priceNum,
      buyUrl: item.buyUrl,
      source: item.source,
      gender,
    })
    setSavedIds(prev => new Set([...prev, id]))
    if (navigator.vibrate) navigator.vibrate(50)
  }

  const chips = CHIPS[gender]
  const visibleResults = onlyProducts ? results.filter(r => r.isProductUrl) : results
  const productCount = results.filter(r => r.isProductUrl).length

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none">🌐</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(query)}
            placeholder={gender === 'mujer' ? 'vestido, blusa, conjunto…' : 'guayabera, polo, lino…'}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition"
          />
        </div>
        <button
          onClick={() => search(query)}
          disabled={loading || !query.trim()}
          className="btn-primary px-4 py-3 text-sm disabled:opacity-40"
        >
          {loading ? '…' : 'Buscar'}
        </button>
      </div>

      {/* Style chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => search(chip)}
            className="flex-shrink-0 glass px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-white transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
          <p className="text-gray-500 text-sm">Buscando en internet…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-red-400 text-sm text-center py-4">{error}</p>
      )}

      {/* No results */}
      {searched && !loading && !error && results.length === 0 && (
        <div className="text-center py-10 text-gray-600">
          <p className="text-3xl mb-2">🔎</p>
          <p className="text-sm">Sin resultados — prueba otra búsqueda</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className="flex flex-col gap-3">
          {/* Filter row */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-gray-600 text-xs">
              {visibleResults.length} resultado{visibleResults.length !== 1 ? 's' : ''}
              {onlyProducts && productCount < results.length && (
                <span className="text-brand-400 ml-1">(solo productos directos)</span>
              )}
            </p>
            <button
              onClick={() => setOnlyProducts(p => !p)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full transition ${
                onlyProducts
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'glass text-gray-500'
              }`}
            >
              {onlyProducts ? '🛍️ Solo productos' : '🌐 Todos'}
            </button>
          </div>

          {visibleResults.length === 0 && (
            <div className="text-center py-6 glass rounded-2xl">
              <p className="text-sm text-gray-400">Sin páginas de producto directo.</p>
              <button onClick={() => setOnlyProducts(false)} className="text-brand-400 text-xs mt-1 underline">
                Ver todos los resultados →
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {visibleResults.map((item, i) => {
              const isSelected = selected?.buyUrl === item.buyUrl
              const savedId = `saved-${item.buyUrl}`
              const saved = savedIds.has(savedId)

              return (
                <div
                  key={i}
                  className={`relative flex flex-col rounded-2xl overflow-hidden transition ${isSelected ? 'card-selected' : 'card'} animate-slide-up`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Image */}
                  <button onClick={() => selectResult(item)} className="relative w-full focus:outline-none">
                    <div className="relative overflow-hidden bg-white/5" style={{ aspectRatio: '3/4' }}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            const el = e.target as HTMLImageElement
                            el.style.display = 'none'
                            el.parentElement!.innerHTML = '<span style="font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%;color:#4b5563">🛍️</span>'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">🛍️</div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-x-0 bottom-0 card-overlay p-2">
                        <p className="text-[10px] text-white/60 uppercase tracking-wider">{item.source}</p>
                        <p className="text-xs text-white font-bold leading-tight line-clamp-2">{item.title}</p>
                        {item.price && (
                          <p className="text-brand-400 text-xs font-bold mt-0.5">{item.price}</p>
                        )}
                      </div>
                      {/* Product badge */}
                      {item.isProductUrl && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#16a34a22', border: '1px solid #16a34a55', color: '#4ade80' }}>
                          ✓ Producto
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="p-2 flex gap-1.5">
                    <a
                      href={item.buyUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      🛍️ Ver
                    </a>
                    <button
                      onClick={() => saved ? undefined : handleSave(item)}
                      disabled={saved}
                      className={`w-8 h-7 flex items-center justify-center rounded-lg text-xs transition ${
                        saved ? 'text-brand-400' : 'text-gray-600 hover:text-brand-400'
                      }`}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      title={saved ? 'Guardado' : 'Guardar en mi catálogo'}
                    >
                      {saved ? '🔖' : '＋'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
