import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  const refererMap: [string, string][] = [
    ['img.kwcdn.com', 'https://www.temu.com/'],
    ['temu.com', 'https://www.temu.com/'],
    ['media-amazon.com', 'https://www.amazon.com.mx/'],
    ['ssl-images-amazon.com', 'https://www.amazon.com.mx/'],
    ['shein.com', 'https://www.shein.com.mx/'],
    ['img.ltwebstatic.com', 'https://www.shein.com.mx/'],
  ]
  const referer = refererMap.find(([domain]) => url.includes(domain))?.[1] ?? 'https://www.google.com/'

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Referer': referer,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${res.status}` }, { status: 400 })
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 400 })
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fetch failed' }, { status: 500 })
  }
}
