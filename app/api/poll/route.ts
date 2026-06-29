import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const statusUrl   = req.nextUrl.searchParams.get('statusUrl')
  const responseUrl = req.nextUrl.searchParams.get('responseUrl')

  if (!statusUrl || !responseUrl) {
    return NextResponse.json({ error: 'Missing statusUrl or responseUrl' }, { status: 400 })
  }

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return NextResponse.json({ error: 'Server configuration error: FAL_KEY not set' }, { status: 500 })
  }

  const headers = { Authorization: `Key ${falKey}` }

  const statusRes = await fetch(statusUrl, { headers })

  if (!statusRes.ok) {
    return NextResponse.json({ error: 'Status check failed' }, { status: statusRes.status })
  }

  const statusData = await statusRes.json()

  if (statusData.status === 'FAILED') {
    return NextResponse.json({ status: 'failed', error: statusData.error ?? 'Generation failed' })
  }

  if (statusData.status !== 'COMPLETED') {
    return NextResponse.json({ status: 'pending' })
  }

  const resultRes = await fetch(responseUrl, { headers })

  if (!resultRes.ok) {
    const errText = await resultRes.text()
    let errMsg = `fal.ai error: ${resultRes.status}`
    try {
      const errData = JSON.parse(errText)
      const detail = errData?.detail
      if (Array.isArray(detail) && detail[0]?.msg) errMsg = detail[0].msg
      else if (typeof detail === 'string') errMsg = detail
    } catch { /* keep default */ }
    return NextResponse.json({ status: 'failed', error: errMsg })
  }

  const result = await resultRes.json()
  // IDM-VTON returns { output: "url" } | Flux Kontext returns { images: [{url}] }
  const imageUrl =
    (result.images as { url: string }[] | undefined)?.[0]?.url ??
    (result.image as { url: string } | undefined)?.url ??
    (typeof result.output === 'string' ? result.output : undefined) ??
    (result.output as string[] | undefined)?.[0]

  if (!imageUrl) {
    return NextResponse.json({ error: 'No image in result', raw: result }, { status: 500 })
  }

  return NextResponse.json({ status: 'completed', imageUrl })
}
