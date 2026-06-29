import { NextRequest, NextResponse } from 'next/server'

const FLUX_KONTEXT_URL = 'https://queue.fal.run/fal-ai/flux-pro/kontext'
const IDM_VTON_URL     = 'https://queue.fal.run/fal-ai/idm-vton'

function toDataUrl(b64: string) {
  return b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`
}

export async function POST(req: NextRequest) {
  try {
    const { photoBase64, prompt, garmentBase64 } = await req.json()

    if (!photoBase64 || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY no configurada en el servidor' }, { status: 500 })
    }

    const personUrl  = toDataUrl(photoBase64)
    const garmentUrl = garmentBase64 ? toDataUrl(garmentBase64) : null

    // Dual-image mode: use IDM-VTON (specialized virtual try-on)
    // Single-image mode: use Flux Kontext (text-guided editing)
    const [url, payload] = garmentUrl
      ? [IDM_VTON_URL, {
          human_image_url:   personUrl,
          garment_image_url: garmentUrl,
          description: prompt,
          denoise_steps: 30,
          seed: 42,
        }]
      : [FLUX_KONTEXT_URL, {
          image_url: personUrl,
          prompt,
        }]

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify(payload),
    })

    const rawText = await response.text()
    console.log(`fal.ai [${garmentUrl ? 'IDM-VTON' : 'Flux-Kontext'}] ${response.status}:`, rawText.slice(0, 400))

    if (!response.ok) {
      return NextResponse.json(
        { error: `fal.ai error: ${response.status}`, details: rawText },
        { status: response.status }
      )
    }

    let data: Record<string, unknown>
    try { data = JSON.parse(rawText) } catch {
      return NextResponse.json({ error: 'Respuesta no JSON de fal.ai', details: rawText }, { status: 500 })
    }

    if (data.request_id) {
      return NextResponse.json({
        status: 'pending',
        predictionId: data.request_id,
        statusUrl:    data.status_url,
        responseUrl:  data.response_url,
      })
    }

    const imageResult =
      (data.images as { url: string }[] | undefined)?.[0]?.url ??
      (data.image as { url: string } | undefined)?.url ??
      (data.output as string[] | undefined)?.[0]

    if (imageResult) {
      return NextResponse.json({ status: 'completed', imageUrl: imageResult })
    }

    return NextResponse.json({ error: 'Respuesta inesperada de fal.ai', raw: data }, { status: 500 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Generate error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
