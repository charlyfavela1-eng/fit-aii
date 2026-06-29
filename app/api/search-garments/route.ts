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

    if (path.includes('/pdp/')) return true
    if (path.includes('/product/')) return true
    if (path.includes('/item/')) return true
    if (host.includes('amazon') && path.includes('/dp/')) return true
    if (host.includes('zara.com') && /\-p\d{7,9}\.html/.test(path)) return true
    if (host.includes('hm.com') && path.includes('productpage')) return true
    if (host.includes('shein') && (/-p-\d+/.test(path) || /-p\d+/.test(path))) return true
    if (host.includes('liverpool') && /\/\d{7,13}$/.test(path.split('?')[0])) return true
    if (host.includes('mercadolibre') && /\/p\/ML/.test(path)) return true
    // Shopify product pages: /products/[slug] with no further segments
    if (/\/products\/[a-z0-9\-]{5,}$/.test(path)) return true
    // Long slug as last segment in 3+ segment path = likely product
    const segs = path.split('/').filter(Boolean)
    const last = segs[segs.length - 1] ?? ''
    const categoryWords = ['hombre', 'mujer', 'ropa', 'camisas', 'vestidos', 'pantalones', 'zapatos', 'blazers', 'polos', 'chinos', 'vestido']
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
  'liverpool', 'palacio', 'zara', 'hm.com', 'amazon', 'abito', 'costavana',
  'mercadolibre', 'coppel', 'suburbia', 'shein', 'bershka', 'pull', 'asos',
  'mango', 'stradivarius', 'oysho', 'massimo', 'tommy', 'lacoste', 'gap',
]

function isFashionDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return FASHION_DOMAINS.some(d => host.includes(d))
  } catch { return false }
}

// ── DuckDuckGo image search (sin API key) ────────────────────────────────────
async function searchDDGImages(q: string, gender: string): Promise<SearchResult[]> {
  const genderTerm = gender === 'mujer' ? 'mujer' : 'hombre'
  const query = `${q} ropa ${genderTerm} comprar mexico precio`
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

  // Step 1: obtain vqd token
  const pageRes = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    {
      headers: { 'User-Agent': ua, 'Accept-Language': 'es-MX,es;q=0.9' },
      signal: AbortSignal.timeout(9000),
    }
  )
  if (!pageRes.ok) throw new Error(`DDG page ${pageRes.status}`)
  const html = await pageRes.text()

  const vqdMatch = html.match(/vqd=["']([^"']+)["']/)
  if (!vqdMatch) throw new Error('No vqd token')
  const vqd = vqdMatch[1]

  // Step 2: fetch image results
  const imgRes = await fetch(
    `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&o=json&p=1&f=,,,,,&l=es-mx`,
    {
      headers: {
        'User-Agent': ua,
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
    .filter(r => isFashionDomain(r.url))
    .map(r => {
      let domain = ''
      try { domain = new URL(r.url).hostname.replace('www.', '') } catch { /* */ }
      const product = isProductUrl(r.url)
      return {
        title: r.title,
        brand: r.source || domain,
        price: '',
        priceNum: 0,
        imageUrl: r.image || r.thumbnail,
        buyUrl: r.url,
        source: domain,
        isProductUrl: product,
      }
    })
    .sort((a, b) => (b.isProductUrl ? 1 : 0) - (a.isProductUrl ? 1 : 0))
    .slice(0, 20)
}

// ── DuckDuckGo HTML fallback (sin imágenes) ───────────────────────────────────
async function searchDDGHtml(q: string, gender: string): Promise<SearchResult[]> {
  const genderTerm = gender === 'mujer' ? 'mujer' : 'hombre'
  const query = encodeURIComponent(`${q} ropa ${genderTerm} precio mexico comprar`)
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
    headers: { 'User-Agent': ua, 'Accept-Language': 'es-MX,es;q=0.9' },
    signal: AbortSignal.timeout(9000),
  })
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
    if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
      links.push({ url, title: m[2].trim() })
    }
  }
  const snippets: string[] = []
  while ((m = snippetRe.exec(html)) !== null) snippets.push(m[1].trim())

  links
    .filter(l => isFashionDomain(l.url))
    .slice(0, 16)
    .forEach((l, i) => {
      const snippet = snippets[i] ?? ''
      const product = isProductUrl(l.url)
      results.push({
        title: l.title,
        brand: (() => { try { return new URL(l.url).hostname.replace('www.', '').split('.')[0] } catch { return '' } })(),
        price: extractPrice(snippet),
        priceNum: parsePrice(snippet),
        imageUrl: '',
        buyUrl: l.url,
        source: (() => { try { return new URL(l.url).hostname.replace('www.', '') } catch { return '' } })(),
        isProductUrl: product,
      })
    })

  return results.sort((a, b) => (b.isProductUrl ? 1 : 0) - (a.isProductUrl ? 1 : 0))
}

// ── Serper.dev ───────────────────────────────────────────────────────────────
async function searchSerper(q: string, key: string, gender: string): Promise<SearchResult[]> {
  const genderTerm = gender === 'mujer' ? 'mujer' : 'hombre'
  const res = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${q} ropa ${genderTerm} mexico`, gl: 'mx', hl: 'es', num: 20 }),
  })
  if (!res.ok) throw new Error(`Serper ${res.status}`)
  const data = await res.json()
  return ((data.shopping ?? []) as { title: string; source?: string; link: string; price?: string; imageUrl?: string }[])
    .filter(i => i.imageUrl)
    .slice(0, 16)
    .map(i => ({
      title: i.title,
      brand: i.source ?? '',
      price: i.price ?? '',
      priceNum: parseFloat((i.price ?? '').replace(/[^0-9.]/g, '')) || 0,
      imageUrl: i.imageUrl ?? '',
      buyUrl: i.link,
      source: i.source ?? '',
      isProductUrl: isProductUrl(i.link),
    }))
}

// ── Brave Search ─────────────────────────────────────────────────────────────
async function searchBrave(q: string, key: string, gender: string): Promise<SearchResult[]> {
  const genderTerm = gender === 'mujer' ? 'mujer' : 'hombre'
  const query = encodeURIComponent(`${q} ropa ${genderTerm} comprar mexico`)
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${query}&count=20&search_lang=es&country=MX&safesearch=off`,
    { headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': key } }
  )
  if (!res.ok) throw new Error(`Brave ${res.status}`)
  const data = await res.json()
  const results = (data.web?.results ?? []) as {
    title: string; url: string; description?: string;
    thumbnail?: { src?: string }; meta_url?: { hostname?: string }
  }[]
  return results
    .filter(r => r.thumbnail?.src)
    .slice(0, 16)
    .map(r => ({
      title: r.title,
      brand: r.meta_url?.hostname?.replace('www.', '') ?? '',
      price: extractPrice(r.description ?? ''),
      priceNum: parsePrice(r.description ?? ''),
      imageUrl: r.thumbnail?.src ?? '',
      buyUrl: r.url,
      source: r.meta_url?.hostname?.replace('www.', '') ?? '',
      isProductUrl: isProductUrl(r.url),
    }))
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
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  const serperKey = process.env.SERPER_API_KEY
  const braveKey  = process.env.BRAVE_API_KEY

  try {
    let results: SearchResult[] = []
    let provider = 'duckduckgo'

    if (serperKey) {
      results = await searchSerper(q, serperKey, gender)
      provider = 'serper'
    } else if (braveKey) {
      results = await searchBrave(q, braveKey, gender)
      provider = 'brave'
    } else {
      // Try DDG image search first (has images), fall back to HTML
      try {
        results = await searchDDGImages(q, gender)
        provider = 'duckduckgo-images'
      } catch {
        results = await searchDDGHtml(q, gender)
        provider = 'duckduckgo'
      }
    }

    return NextResponse.json({ results, provider })
  } catch (e) {
    try {
      const results = await searchDDGHtml(q, gender)
      return NextResponse.json({ results, provider: 'duckduckgo' })
    } catch {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed' }, { status: 500 })
    }
  }
}
