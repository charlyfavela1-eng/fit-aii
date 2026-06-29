import { NextRequest, NextResponse } from 'next/server'

export interface SearchResult {
  title: string
  brand: string
  price: string
  priceNum: number
  imageUrl: string
  buyUrl: string
  source: string
  isProductUrl: boolean
}

// ── URL de producto vs página de categoría ────────────────────────────────────
function isProductUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const path = u.pathname.toLowerCase()
    const host = u.hostname.toLowerCase()

    // Temu: /mx/slug-g-601099582759392.html
    if (host.includes('temu.com') && /-g-\d{6,}\.html/.test(path)) return true
    // Generic product paths
    if (path.includes('/pdp/')) return true
    if (path.includes('/product/')) return true
    if (path.includes('/item/')) return true
    // Amazon: /dp/ASIN
    if (host.includes('amazon') && /\/dp\/[A-Z0-9]{10}/.test(path)) return true
    // Zara
    if (host.includes('zara.com') && /\-p\d{7,9}\.html/.test(path)) return true
    // H&M
    if (host.includes('hm.com') && path.includes('productpage')) return true
    // Shein
    if (host.includes('shein') && (/-p-\d+/.test(path) || /-p\d+/.test(path))) return true
    // Liverpool
    if (host.includes('liverpool') && /\/\d{7,13}$/.test(path.split('?')[0])) return true
    // MercadoLibre
    if (host.includes('mercadolibre') && /\/p\/ML/.test(path)) return true
    // Shopify /products/[slug]
    if (/\/products\/[a-z0-9\-]{5,}$/.test(path)) return true
    // Long slug as last segment (fallback)
    const segs = path.split('/').filter(Boolean)
    const last = segs[segs.length - 1] ?? ''
    const categoryWords = ['hombre', 'mujer', 'ropa', 'camisas', 'vestidos', 'pantalones',
      'zapatos', 'blazers', 'polos', 'chinos', 'vestido', 'search_result', 'category']
    if (
      segs.length >= 3 &&
      last.length > 20 &&
      last.split('-').length >= 4 &&
      !categoryWords.includes(last)
    ) return true

    return false
  } catch { return false }
}

const FASHION_DOMAINS = [
  'temu', 'liverpool', 'palacio', 'zara', 'hm.com', 'amazon', 'abito', 'costavana',
  'mercadolibre', 'coppel', 'suburbia', 'shein', 'bershka', 'pull', 'asos',
  'mango', 'stradivarius', 'oysho', 'massimo', 'tommy', 'lacoste', 'gap',
  'forever21', 'primark', 'h&m', 'famsa',
]

function isFashionDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return FASHION_DOMAINS.some(d => host.includes(d))
  } catch { return false }
}

function sourceName(url: string): string {
  try { return new URL(url).hostname.replace('www.', '').split('.')[0] } catch { return '' }
}

// ── DDG image search — genérica o con site: ───────────────────────────────────
const DDG_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

async function ddgImageSearch(query: string): Promise<SearchResult[]> {
  // Step 1: get vqd token
  const pageRes = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    {
      headers: { 'User-Agent': DDG_UA, 'Accept-Language': 'es-MX,es;q=0.9' },
      signal: AbortSignal.timeout(9000),
    }
  )
  if (!pageRes.ok) throw new Error(`DDG page ${pageRes.status}`)
  const html = await pageRes.text()
  const vqd = html.match(/vqd=["']([^"']+)["']/)?.[1]
  if (!vqd) throw new Error('No vqd token')

  // Step 2: image results
  const imgRes = await fetch(
    `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&o=json&p=1&f=,,,,,&l=es-mx`,
    {
      headers: {
        'User-Agent': DDG_UA,
        'Accept': 'application/json, */*; q=0.01',
        'Referer': 'https://duckduckgo.com/',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(9000),
    }
  )
  if (!imgRes.ok) throw new Error(`DDG images ${imgRes.status}`)
  const data = await imgRes.json() as {
    results?: Array<{ title: string; image: string; thumbnail: string; url: string; source: string }>
  }

  return (data.results ?? [])
    .filter(r => r.url && r.image && isFashionDomain(r.url))
    .map(r => ({
      title: r.title,
      brand: r.source || sourceName(r.url),
      price: '',
      priceNum: 0,
      imageUrl: r.image || r.thumbnail,
      buyUrl: r.url,
      source: sourceName(r.url),
      isProductUrl: isProductUrl(r.url),
    }))
}

// ── DDG HTML fallback (sin imágenes) ─────────────────────────────────────────
async function ddgHtmlSearch(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
      signal: AbortSignal.timeout(9000),
    }
  )
  if (!res.ok) throw new Error(`DDG HTML ${res.status}`)
  const html = await res.text()

  const results: SearchResult[] = []
  const linkRe = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
  const snippetRe = /class="result__snippet"[^>]*>([^<]+)</g
  const links: { url: string; title: string }[] = []
  let m
  while ((m = linkRe.exec(html)) !== null) {
    let url = m[1]
    if (url.includes('uddg=')) {
      try { url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]) } catch { /* */ }
    }
    if (url.startsWith('http') && !url.includes('duckduckgo.com'))
      links.push({ url, title: m[2].trim() })
  }
  const snippets: string[] = []
  while ((m = snippetRe.exec(html)) !== null) snippets.push(m[1].trim())

  links
    .filter(l => isFashionDomain(l.url))
    .slice(0, 20)
    .forEach((l, i) => {
      const snippet = snippets[i] ?? ''
      results.push({
        title: l.title,
        brand: sourceName(l.url),
        price: extractPrice(snippet),
        priceNum: parsePrice(snippet),
        imageUrl: '',
        buyUrl: l.url,
        source: sourceName(l.url),
        isProductUrl: isProductUrl(l.url),
      })
    })
  return results.sort((a, b) => (b.isProductUrl ? 1 : 0) - (a.isProductUrl ? 1 : 0))
}

// ── Serper.dev Google Shopping ────────────────────────────────────────────────
async function searchSerper(q: string, key: string, gender: string): Promise<SearchResult[]> {
  const genderTerm = gender === 'hombre' ? 'hombre' : 'mujer'
  const res = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${q} ${genderTerm} mexico`, gl: 'mx', hl: 'es', num: 20 }),
  })
  if (!res.ok) throw new Error(`Serper ${res.status}`)
  const data = await res.json()
  return ((data.shopping ?? []) as { title: string; source?: string; link: string; price?: string; imageUrl?: string }[])
    .filter(i => i.imageUrl && i.link)
    .slice(0, 20)
    .map(i => ({
      title: i.title,
      brand: i.source ?? '',
      price: i.price ?? '',
      priceNum: parseFloat((i.price ?? '').replace(/[^0-9.]/g, '')) || 0,
      imageUrl: i.imageUrl ?? '',
      buyUrl: i.link,
      source: i.source ?? '',
      isProductUrl: true, // Google Shopping always returns product pages
    }))
}

// ── Búsqueda dirigida por tienda ──────────────────────────────────────────────
// Busca con "site:tienda.com" para garantizar links de producto reales
async function searchByStore(q: string, store: string, gender: string): Promise<SearchResult[]> {
  const genderTerm = gender === 'hombre' ? 'hombre' : 'mujer'
  const query = `site:${store} ${q} ${genderTerm}`
  try {
    const results = await ddgImageSearch(query)
    // If site: search gives no images, try HTML
    if (results.length === 0) {
      const htmlResults = await ddgHtmlSearch(query)
      return htmlResults.filter(r => isProductUrl(r.buyUrl))
    }
    return results.filter(r => isProductUrl(r.buyUrl))
  } catch {
    const htmlResults = await ddgHtmlSearch(query)
    return htmlResults.filter(r => isProductUrl(r.buyUrl))
  }
}

// ── Búsqueda multi-tienda en paralelo ─────────────────────────────────────────
async function searchMultiStore(q: string, gender: string, site: string | null): Promise<SearchResult[]> {
  const stores = site === 'temu'   ? ['temu.com']
               : site === 'amazon' ? ['amazon.com.mx']
               : site === 'shein'  ? ['shein.com']
               : ['temu.com', 'amazon.com.mx']   // default: ambas

  const settled = await Promise.allSettled(
    stores.map(s => searchByStore(q, s, gender))
  )

  // Merge and deduplicate by buyUrl
  const seen = new Set<string>()
  const merged: SearchResult[] = []
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        if (!seen.has(item.buyUrl)) {
          seen.add(item.buyUrl)
          merged.push(item)
        }
      }
    }
  }
  return merged
}

function extractPrice(text: string): string {
  const m = text.match(/\$[\d,]+(?:\.\d{2})?/)
  return m ? m[0] : ''
}
function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+(?:\.\d{2})?)/)
  return m ? parseFloat(m[1].replace(',', '')) : 0
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const q      = req.nextUrl.searchParams.get('q')
  const gender = req.nextUrl.searchParams.get('gender') ?? 'mujer'
  const site   = req.nextUrl.searchParams.get('site') ?? null  // 'temu' | 'amazon' | 'shein' | null

  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  const serperKey = process.env.SERPER_API_KEY

  try {
    // 1. Serper Google Shopping — más confiable, siempre links de producto
    if (serperKey) {
      const results = await searchSerper(q, serperKey, gender)
      const filtered = site
        ? results.filter(r => r.source.toLowerCase().includes(site))
        : results
      return NextResponse.json({ results: filtered, provider: 'google-shopping' })
    }

    // 2. Búsqueda dirigida por tienda con site: operator — links reales garantizados
    const results = await searchMultiStore(q, gender, site)
    if (results.length >= 3) {
      return NextResponse.json({ results: results.slice(0, 20), provider: 'tienda-directa' })
    }

    // 3. Fallback: DDG general con filter de producto
    const fallback = await ddgImageSearch(
      `${q} ${gender === 'hombre' ? 'hombre' : 'mujer'} comprar mexico precio`
    )
    const onlyProducts = fallback.filter(r => r.isProductUrl)
    return NextResponse.json({
      results: (onlyProducts.length >= 3 ? onlyProducts : fallback).slice(0, 20),
      provider: 'duckduckgo',
    })

  } catch {
    try {
      const results = await ddgHtmlSearch(
        `${q} ${gender === 'hombre' ? 'hombre' : 'mujer'} comprar mexico precio`
      )
      return NextResponse.json({ results, provider: 'duckduckgo-html' })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed' }, { status: 500 })
    }
  }
}
