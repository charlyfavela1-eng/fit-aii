'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { decodeCatalogLink, CatalogShareData, CatalogShareItem, CATEGORY_LABELS, CATEGORY_EMOJIS, buildWhatsAppLink } from '@/lib/store-catalog'

export default function PublicCatalogPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : ''
  const [catalog, setCatalog] = useState<CatalogShareData | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<CatalogShareItem | null>(null)

  useEffect(() => {
    if (!slug) { setError(true); return }
    const data = decodeCatalogLink(slug)
    if (!data) setError(true)
    else setCatalog(data)
  }, [slug])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-6xl">🔗</div>
        <h1 className="text-2xl font-bold text-white">Enlace no válido</h1>
        <p className="text-white/50 text-sm">Este catálogo ya no está disponible o el enlace es incorrecto.</p>
        <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm font-bold">Ir al inicio</Link>
      </div>
    )
  }

  if (!catalog) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const contactWhatsApp = (item?: CatalogShareItem) => {
    if (!catalog.w) return
    const intro = item
      ? `Hola! Me interesa la prenda: *${item.n}*\n💰 $${item.p.toLocaleString('es-MX')} ${item.cu}\n📏 Tallas: ${item.s.join(', ')}\n\n`
      : `Hola! Vi tu catálogo y me gustaría más información.\n\n`
    const link = buildWhatsAppLink(catalog.w, intro)
    window.open(link, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero header */}
      <div className="px-4 pt-10 pb-6 text-center">
        <div className="text-5xl mb-3">🛍️</div>
        <h1 className="text-3xl font-bold text-gradient">{catalog.n}</h1>
        {catalog.d && <p className="text-white/60 text-sm mt-2 max-w-xs mx-auto leading-relaxed">{catalog.d}</p>}

        <div className="flex justify-center gap-3 mt-4">
          {catalog.w && (
            <button
              onClick={() => contactWhatsApp()}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold"
            >
              📲 WhatsApp
            </button>
          )}
          {catalog.i && (
            <a
              href={`https://instagram.com/${catalog.i}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              📸 Instagram
            </a>
          )}
        </div>
      </div>

      {/* Garment detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div className="glass rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-white text-lg">{selected.n}</h3>
                <p className="text-brand-400 font-bold text-xl">${selected.p.toLocaleString('es-MX')} {selected.cu}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/40 text-2xl leading-none hover:text-white">×</button>
            </div>

            {selected.d && <p className="text-white/70 text-sm mb-3 leading-relaxed">{selected.d}</p>}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selected.s.map(s => (
                <span key={s} className="bg-accent-500/20 text-accent-400 rounded-lg px-2.5 py-1 text-xs font-bold">{s}</span>
              ))}
            </div>

            {selected.pm !== 'efectivo' && (
              <button
                onClick={() => {
                  if (selected.pm === 'whatsapp' && catalog.w) {
                    contactWhatsApp(selected)
                  } else if (selected.pl) {
                    window.open(selected.pl, '_blank')
                  } else if (catalog.w) {
                    contactWhatsApp(selected)
                  }
                }}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold"
              >
                {selected.pm === 'whatsapp' && '📲 Pedir por WhatsApp'}
                {selected.pm === 'mercadopago' && '💳 Pagar con MercadoPago'}
                {selected.pm === 'tienda' && '🛒 Ver en tienda'}
              </button>
            )}
            {selected.pm === 'efectivo' && (
              <button
                onClick={() => catalog.w && contactWhatsApp(selected)}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold"
              >
                📲 Consultar disponibilidad
              </button>
            )}
          </div>
        </div>
      )}

      {/* Catalog grid */}
      <div className="px-4 pb-10">
        {catalog.g.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <div className="text-5xl mb-3">🛍️</div>
            <p>Este catálogo no tiene prendas por el momento.</p>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-xs mb-3">{catalog.g.length} {catalog.g.length === 1 ? 'prenda' : 'prendas'} disponibles</p>
            <div className="grid grid-cols-2 gap-3">
              {catalog.g.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="card rounded-2xl overflow-hidden text-left hover:scale-[1.02] transition-transform"
                >
                  <div className="w-full aspect-square flex items-center justify-center bg-white/5 text-5xl">
                    {CATEGORY_EMOJIS[(item.c as keyof typeof CATEGORY_EMOJIS)] ?? '🛍️'}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-white text-sm truncate">{item.n}</p>
                    <p className="text-brand-400 text-sm font-bold mt-0.5">
                      ${item.p.toLocaleString('es-MX')} {item.cu}
                    </p>
                    <p className="text-white/40 text-xs mt-1">{item.s.join(' · ')}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-white/20 text-xs px-4">
        <p>Catálogo creado con <span className="text-gradient font-semibold">FitAI</span></p>
        <Link href="/" className="underline hover:text-white/40 transition-colors mt-1 inline-block">
          Crear tu catálogo gratis →
        </Link>
      </div>
    </div>
  )
}
