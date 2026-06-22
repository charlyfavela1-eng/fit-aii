import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { photoBase64, prompt, garmentImageUrl } = await req.json()

    if (!photoBase64 || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = process.env.ATLAS_API_KEY
    const apiUrl = process.env.ATLAS_API_URL

    if (!apiKey || !apiUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body: Record<string, unknown> = {
      model: 'google/nano-banana-2/edit',
      prompt,
      image: photoBase64,
      enable_sync_mode: false,
    }

    if (garmentImageUrl) {
      body.reference_image = garmentImageUrl
    }

    const response = await fetch(`${apiUrl}/generateImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Atlas API error:', errorText)
      return NextResponse.json(
        { error: `Atlas API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.images && data.images[0]) {
      return NextResponse.json({ status: 'completed', imageUrl: data.images[0] })
    }

    if (data.id || data.prediction_id) {
      return NextResponse.json({
        status: 'pending',
        predictionId: data.id || data.prediction_id,
      })
    }

    return NextResponse.json({ error: 'Unexpected response format', raw: data }, { status: 500 })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
