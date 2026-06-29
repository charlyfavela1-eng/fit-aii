'use client'

import { useState, useMemo } from 'react'

interface Product {
  id: number
  name: string
  brand: string
  price: number
  image: string
  buyUrl: string
  styles: string[]
  color: string
}

const U = (id: string) => `https://images.unsplash.com/${id}?w=600&fm=jpg&fit=crop&h=800`

const PRODUCTS: Product[] = [
  // OLD MONEY
  {
    id: 1,
    name: 'Abrigo largo camel wool',
    brand: 'Zara',
    price: 3299,
    image: U('photo-1619603364937-8d7af41ef206'),
    buyUrl: 'https://www.zara.com/mx/es/abrigo-lana-man-l-mkt1007850.html',
    styles: ['Old Money', 'Business'],
    color: 'Camel',
  },
  {
    id: 2,
    name: 'Blazer cuadros navy windowpane',
    brand: 'Massimo Dutti',
    price: 4199,
    image: U('photo-1593030942428-a5451dca4b42'),
    buyUrl: 'https://www.massimodutti.com/mx/blazers',
    styles: ['Old Money', 'Business'],
    color: 'Navy',
  },
  {
    id: 3,
    name: 'Blazer tweed café herringbone',
    brand: 'Massimo Dutti',
    price: 3799,
    image: U('photo-1697319501786-8f5dc64326ad'),
    buyUrl: 'https://www.massimodutti.com/mx/blazers',
    styles: ['Old Money', 'Smart Casual'],
    color: 'Café',
  },
  {
    id: 4,
    name: 'Abrigo camel calle urbano',
    brand: 'H&M',
    price: 1899,
    image: U('photo-1517938889432-a2ac9241a486'),
    buyUrl: 'https://www2.hm.com/es_mx/hombre/ropa/abrigos-y-chaquetas.html',
    styles: ['Old Money', 'Smart Casual'],
    color: 'Camel',
  },
  {
    id: 5,
    name: 'Traje doble botonadura azul royal',
    brand: 'Zara',
    price: 5499,
    image: U('photo-1621061415651-2b7fa415360b'),
    buyUrl: 'https://www.zara.com/mx/es/trajes-man-l-mkt2.html',
    styles: ['Old Money', 'Business'],
    color: 'Azul Royal',
  },
  {
    id: 6,
    name: 'Suit slim fit negro gala',
    brand: 'Zara',
    price: 4599,
    image: U('photo-1617127365659-c47fa864d8bc'),
    buyUrl: 'https://www.zara.com/mx/es/trajes-man-l-mkt2.html',
    styles: ['Business', 'Gala'],
    color: 'Negro',
  },
  {
    id: 7,
    name: 'Traje negro formal slim',
    brand: 'H&M',
    price: 2999,
    image: U('photo-1617113930975-f9c7243ae527'),
    buyUrl: 'https://www2.hm.com/es_mx/hombre/ropa/trajes.html',
    styles: ['Business', 'Gala'],
    color: 'Negro',
  },
  {
    id: 8,
    name: 'Traje ejecutivo gris carbón',
    brand: 'ASOS',
    price: 3499,
    image: U('photo-1594938298603-c8148c4dae35'),
    buyUrl: 'https://www.asos.com/mx/hombre/trajes/',
    styles: ['Business', 'Old Money'],
    color: 'Gris',
  },
  {
    id: 9,
    name: 'Camisa oxford blanca premium',
    brand: 'Massimo Dutti',
    price: 899,
    image: U('photo-1507679799987-c73779587ccf'),
    buyUrl: 'https://www.massimodutti.com/mx/camisas',
    styles: ['Business', 'Smart Casual', 'Old Money'],
    color: 'Blanco',
  },
  {
    id: 10,
    name: 'Pantalón chino beige slim',
    brand: 'Zara',
    price: 799,
    image: U('photo-1519085360753-af0119f7cbe7'),
    buyUrl: 'https://www.zara.com/mx/es/pantalones-man-l-mkt2.html',
    styles: ['Smart Casual', 'Old Money'],
    color: 'Beige',
  },
  {
    id: 11,
    name: 'Jersey cuello alto merino crema',
    brand: 'ASOS',
    price: 1299,
    image: U('photo-1564859228273-274232fdb516'),
    buyUrl: 'https://www.asos.com/mx/hombre/jerseis-y-sudaderas/',
    styles: ['Old Money', 'Smart Casual'],
    color: 'Crema',
  },
  {
    id: 12,
    name: 'Polo piqué navy logo bordado',
    brand: 'Lacoste',
    price: 1599,
    image: U('photo-1598808503746-f34c53b9323e'),
    buyUrl: 'https://www.lacoste.com/mx/hombre/ropa/polos/',
    styles: ['Smart Casual', 'Old Money'],
    color: 'Navy',
  },
  {
    id: 13,
    name: 'Camiseta premium algodón pima',
    brand: 'ASOS',
    price: 599,
    image: U('photo-1489987707025-afc232f7ea0f'),
    buyUrl: 'https://www.asos.com/mx/hombre/camisetas/',
    styles: ['Casual', 'Smart Casual'],
    color: 'Blanco',
  },
  {
    id: 14,
    name: 'Jeans slim raw selvedge',
    brand: 'Zara',
    price: 1099,
    image: U('photo-1542272604-787c3835535d'),
    buyUrl: 'https://www.zara.com/mx/es/jeans-man-l-mkt2.html',
    styles: ['Casual', 'Smart Casual'],
    color: 'Índigo',
  },
  {
    id: 15,
    name: 'Chaqueta bomber varsity negro',
    brand: 'H&M',
    price: 1499,
    image: U('photo-1539109136881-3be0616acf4b'),
    buyUrl: 'https://www2.hm.com/es_mx/hombre/ropa/abrigos-y-chaquetas.html',
    styles: ['Streetwear', 'Casual'],
    color: 'Negro',
  },
  {
    id: 16,
    name: 'Hoodie oversized premium fleece',
    brand: 'ASOS',
    price: 999,
    image: U('photo-1622519407650-3df9883f76a5'),
    buyUrl: 'https://www.asos.com/mx/hombre/sudaderas-con-capucha/',
    styles: ['Streetwear', 'Casual'],
    color: 'Gris',
  },
  {
    id: 17,
    name: 'Chaleco puffer ligero sport',
    brand: 'Zara',
    price: 1199,
    image: U('photo-1583743814966-8936f5b7be1a'),
    buyUrl: 'https://www.zara.com/mx/es/chalecos-man-l-mkt2.html',
    styles: ['Casual', 'Streetwear'],
    color: 'Negro',
  },
  {
    id: 18,
    name: 'Oxford brogue cuero café',
    brand: 'Massimo Dutti',
    price: 2799,
    image: U('photo-1490114538077-0a7f8cb49891'),
    buyUrl: 'https://www.massimodutti.com/mx/zapatos',
    styles: ['Old Money', 'Business', 'Smart Casual'],
    color: 'Café',
  },
  {
    id: 19,
    name: 'Sneaker cuero blanco limpio',
    brand: 'ASOS',
    price: 1399,
    image: U('photo-1526170375885-4d8ecf77b99f'),
    buyUrl: 'https://www.asos.com/mx/hombre/zapatillas/',
    styles: ['Smart Casual', 'Casual'],
    color: 'Blanco',
  },
  {
    id: 20,
    name: 'Chelsea boot negro piel',
    brand: 'Zara',
    price: 1999,
    image: U('photo-1591047139829-d91aecb6caea'),
    buyUrl: 'https://www.zara.com/mx/es/botas-man-l-mkt2.html',
    styles: ['Business', 'Smart Casual', 'Old Money'],
    color: 'Negro',
  },
  {
    id: 21,
    name: 'Cinturón piel trenzado cognac',
    brand: 'Massimo Dutti',
    price: 799,
    image: U('photo-1585386959984-a4155224a1ad'),
    buyUrl: 'https://www.massimodutti.com/mx/complementos',
    styles: ['Old Money', 'Business'],
    color: 'Cognac',
  },
  {
    id: 22,
    name: 'Corbata seda cobre geométrica',
    brand: 'Zara',
    price: 499,
    image: U('photo-1441986300917-64674bd600d8'),
    buyUrl: 'https://www.zara.com/mx/es/corbatas-man-l-mkt2.html',
    styles: ['Business', 'Old Money'],
    color: 'Cobre',
  },
]

const ALL_STYLES = ['Todos', 'Old Money', 'Business', 'Smart Casual', 'Casual', 'Streetwear', 'Gala']

const STYLE_COLORS: Record<string, string> = {
  'Old Money':    '#c9a84c',
  'Business':     '#4c7bc9',
  'Smart Casual': '#4cb87b',
  'Casual':       '#c94c6e',
  'Streetwear':   '#9b4cc9',
  'Gala':         '#c94ca8',
}

export default function CatalogoPage() {
  const [query, setQuery]           = useState('')
  const [activeStyle, setActiveStyle] = useState('Todos')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return PRODUCTS.filter(p => {
      const matchStyle = activeStyle === 'Todos' || p.styles.includes(activeStyle)
      const matchQuery = !q || (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.styles.some(s => s.toLowerCase().includes(q))
      )
      return matchStyle && matchQuery
    })
  }, [query, activeStyle])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '2rem 2rem 1rem', borderBottom: '1px solid #1a1a1a' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          Catálogo de Prendas
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#444', fontSize: '0.8rem' }}>
          Busca por estilo, color o marca · {PRODUCTS.length} prendas disponibles
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10 }}>

        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 520, marginBottom: '1rem' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: '#444', fontSize: '1rem', pointerEvents: 'none',
          }}>⌕</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar: blazer, camel, Zara, old money…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111', border: '1px solid #222',
              borderRadius: 12, padding: '0.7rem 1rem 0.7rem 2.5rem',
              color: '#fff', fontSize: '0.9rem', outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1rem',
              }}
            >✕</button>
          )}
        </div>

        {/* Style chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {ALL_STYLES.map(style => {
            const active = activeStyle === style
            const color = style === 'Todos' ? '#fff' : (STYLE_COLORS[style] ?? '#fff')
            return (
              <button
                key={style}
                onClick={() => setActiveStyle(style)}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: 999,
                  border: `1px solid ${active ? color : '#222'}`,
                  background: active ? `${color}18` : 'transparent',
                  color: active ? color : '#555',
                  fontSize: '0.75rem',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {style}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '1.5rem 2rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#333', padding: '4rem 0' }}>
            <p style={{ fontSize: '2rem' }}>🔍</p>
            <p>Sin resultados para "{query}"</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#333', fontSize: '0.75rem', marginBottom: '1rem' }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product: p }: { product: Product }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${hovered ? '#2a2a2a' : '#1a1a1a'}`,
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#181818' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
        />
        {/* Style badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {p.styles.slice(0, 1).map(s => (
            <span key={s} style={{
              background: `${STYLE_COLORS[s] ?? '#666'}22`,
              border: `1px solid ${STYLE_COLORS[s] ?? '#666'}55`,
              color: STYLE_COLORS[s] ?? '#fff',
              fontSize: '0.6rem', fontWeight: 700,
              padding: '2px 6px', borderRadius: 999,
              backdropFilter: 'blur(4px)',
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {p.brand}
        </p>
        <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3, color: '#e0e0e0' }}>
          {p.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
            ${p.price.toLocaleString('es-MX')} <span style={{ fontSize: '0.65rem', color: '#444', fontWeight: 400 }}>MXN</span>
          </span>

          <a
            href={p.buyUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Comprar →
          </a>
        </div>

        {/* Color */}
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.62rem', color: '#333' }}>
          Color: {p.color}
        </p>
      </div>
    </div>
  )
}
