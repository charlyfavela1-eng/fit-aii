import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const predictionId = req.nextUrl.searchParams.get('id')

  if (!predictionId) {
    return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 })
  }

  const apiKey = process.env.ATLAS_API_KEY
  const apiUrl = process.env.ATLAS_API_URL

  const response = await fetch(`${apiUrl}/prediction/${predictionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Poll failed' }, { status: response.status })
  }

  const data = await response.json()

  if (data.status === 'succeeded' || data.status === 'completed') {
    const imageUrl = data.output?.[0] ?? data.images?.[0] ?? data.image
    return NextResponse.json({ status: 'completed', imageUrl })
  }

  if (data.status === 'failed') {
    return NextResponse.json({ status: 'failed', error: data.error })
  }

  return NextResponse.json({ status: 'pending' })
}
