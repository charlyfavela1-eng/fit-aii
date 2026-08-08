import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/* Buscar prendas fuera del catalogo. Sin esto solo puedes probarte las 6
 * prendas de ejemplo, que es lo que hacia inutil al probador.
 *
 * Dos entradas:
 *
 *   ?url=   pegas el enlace del producto y se saca su foto oficial. Gratis.
 *   ?q=     se busca en Google y se le saca la foto a cada producto que salga.
 *
 * Por que la busqueda NO usa un scraper de Google Imagenes: se probaron dos.
 * `hooli/google-images-scraper` devolvio resultados de otra cosa ("Apeiron
 * Labs" para "chamarra de mezclilla") y `easyapi/google-images-scraper`
 * devolvio cero con la consulta valida. El buscador oficial de Apify si trae
 * las paginas de producto correctas (Gap, Mercado Libre, H&M), y de ahi se
 * reusa la extraccion del enlace, que ya estaba probada. De paso el resultado
 * es mejor: la foto oficial del producto en vez de una miniatura de Google, y
 * cada prenda se queda con el enlace de donde comprarla.
 */

const BUSCADOR = process.env.APIFY_ACTOR_BUSQUEDA || 'apify~google-search-scraper'
const CUANTAS = 8

interface Prenda {
  imagen: string
  titulo: string
  fuente: string
  enlace: string
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  const url = req.nextUrl.searchParams.get('url')

  if (url) {
    const p = await fotoDePagina(url)
    if (!p) {
      return NextResponse.json(
        { error: 'Esa pagina no publica la foto del producto. Baja la imagen y subela a mano.' },
        { status: 422 }
      )
    }
    return NextResponse.json({ prendas: [p] })
  }

  if (q) return porBusqueda(q)
  return NextResponse.json({ error: 'Manda ?q= o ?url=' }, { status: 400 })
}

/* ------------------------------------------ la foto oficial de una pagina */

async function fotoDePagina(url: string): Promise<Prenda | null> {
  let destino: URL
  try { destino = new URL(url) } catch { return null }
  if (!/^https?:$/.test(destino.protocol)) return null

  try {
    const ctrl = new AbortController()
    const reloj = setTimeout(() => ctrl.abort(), 9000)
    const r = await fetch(destino.toString(), {
      headers: {
        // Sin User-Agent de navegador muchas tiendas devuelven una pagina vacia.
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    clearTimeout(reloj)
    const html = (await r.text()).slice(0, 400_000)

    const meta = (prop: string) => {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')
      const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i')
      return html.match(re)?.[1] || html.match(alt)?.[1] || null
    }

    /* Muchas tiendas no ponen og:image pero SI publican datos estructurados de
       producto, porque los necesitan para Google Shopping. Ahi vive la foto. */
    const jsonLd = () => {
      for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          const dato = JSON.parse(m[1].trim())
          const nodos = Array.isArray(dato) ? dato : [dato, ...(dato['@graph'] || [])]
          for (const n of nodos) {
            if (!n || typeof n !== 'object') continue
            const img = n.image
            const u = Array.isArray(img) ? img[0] : (typeof img === 'object' ? img?.url : img)
            if (typeof u === 'string' && u) return u
          }
        } catch { /* un bloque roto no debe tumbar los demas */ }
      }
      return null
    }

    const imagen = meta('og:image') || meta('twitter:image') || jsonLd()
    if (!imagen) return null

    return {
      imagen: new URL(imagen, destino).toString(),
      titulo: meta('og:title') || destino.hostname,
      fuente: destino.hostname.replace(/^www\./, ''),
      enlace: destino.toString(),
    }
  } catch {
    return null
  }
}

/* ------------------------------------------------------ buscar en Google */

async function porBusqueda(q: string) {
  const token = process.env.APIFY_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Falta APIFY_TOKEN en el servidor' }, { status: 500 })
  }

  try {
    const r = await fetch(
      `https://api.apify.com/v2/acts/${BUSCADOR}/run-sync-get-dataset-items?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: `${q} comprar`,
          resultsPerPage: 10,
          maxPagesPerQuery: 1,
          countryCode: 'mx',
          languageCode: 'es',
        }),
      }
    )

    if (!r.ok) {
      const t = await r.text()
      return NextResponse.json({ error: `Apify ${r.status}: ${t.slice(0, 160)}` }, { status: 502 })
    }

    const paginas = await r.json()
    const enlaces: string[] = []
    for (const p of Array.isArray(paginas) ? paginas : []) {
      for (const o of p.organicResults || []) {
        if (typeof o.url === 'string') enlaces.push(o.url)
      }
    }

    // En paralelo: una tienda lenta no debe hacer esperar a las demas.
    const sacadas = await Promise.all(enlaces.slice(0, CUANTAS).map(fotoDePagina))
    const prendas = sacadas.filter((p): p is Prenda => !!p)

    if (!prendas.length) {
      return NextResponse.json(
        { error: 'Se encontraron tiendas pero ninguna publico la foto. Prueba con otro texto o sube la imagen.' },
        { status: 422 }
      )
    }
    return NextResponse.json({ prendas })
  } catch {
    return NextResponse.json({ error: 'Fallo la busqueda' }, { status: 502 })
  }
}
