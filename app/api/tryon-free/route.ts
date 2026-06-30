import { NextRequest, NextResponse } from 'next/server'

const HF_SPACE = 'https://yisol-idm-vton.hf.space'

async function uploadImage(base64OrUrl: string, filename: string): Promise<string> {
  let buffer: Buffer
  let mimeType = 'image/jpeg'

  if (base64OrUrl.startsWith('http')) {
    const res = await fetch(base64OrUrl)
    buffer = Buffer.from(await res.arrayBuffer())
    mimeType = res.headers.get('content-type') ?? 'image/jpeg'
  } else {
    const b64 = base64OrUrl.includes(',') ? base64OrUrl.split(',')[1] : base64OrUrl
    mimeType = base64OrUrl.startsWith('data:') ? base64OrUrl.split(';')[0].split(':')[1] : 'image/jpeg'
    buffer = Buffer.from(b64, 'base64')
  }

  const formData = new FormData()
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  formData.append('files', new Blob([ab], { type: mimeType }), filename)

  const res = await fetch(`${HF_SPACE}/upload`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`Upload falló: ${res.status} ${await res.text()}`)
  const paths: string[] = await res.json()
  return paths[0]
}

export async function POST(req: NextRequest) {
  try {
    const { personBase64, garmentBase64, garmentUrl, garmentDescription } = await req.json()

    if (!personBase64) return NextResponse.json({ error: 'Falta foto de la persona' }, { status: 400 })
    const garmentSrc = garmentBase64 || garmentUrl
    if (!garmentSrc) return NextResponse.json({ error: 'Falta imagen de la prenda' }, { status: 400 })

    // Upload both images in parallel
    const [personPath, garmentPath] = await Promise.all([
      uploadImage(personBase64, 'person.jpg'),
      uploadImage(garmentSrc, 'garment.jpg'),
    ])

    // Join the HuggingFace queue
    const callRes = await fetch(`${HF_SPACE}/call/tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          {
            background: { path: personPath, orig_name: 'person.jpg', meta: { _type: 'gradio.FileData' } },
            layers: [],
            composite: null,
          },
          { path: garmentPath, orig_name: 'garment.jpg', meta: { _type: 'gradio.FileData' } },
          garmentDescription || 'clothing item',
          true,   // auto masking
          false,  // crop
          30,     // denoise steps
          42,     // seed
        ],
      }),
    })

    if (!callRes.ok) throw new Error(`Queue join falló: ${callRes.status} ${await callRes.text()}`)
    const { event_id } = await callRes.json()

    // Read SSE stream until result is ready (max 3 min)
    const streamRes = await fetch(`${HF_SPACE}/call/tryon/${event_id}`, {
      signal: AbortSignal.timeout(180_000),
    })
    if (!streamRes.ok || !streamRes.body) throw new Error('No se pudo conectar al stream')

    const reader = streamRes.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))

          if (evt.msg === 'queue_full') {
            return NextResponse.json({ error: 'HuggingFace está saturado, intenta en unos minutos' }, { status: 503 })
          }

          if (evt.msg === 'process_completed') {
            if (!evt.success) throw new Error('El proceso falló en HuggingFace')
            const out = evt.output?.data?.[0]
            if (!out) throw new Error('Sin imagen de resultado')
            const imageUrl = out.url ?? `${HF_SPACE}/file=${out.path}`
            return NextResponse.json({ status: 'completed', imageUrl })
          }

          if (evt.msg === 'estimation' || evt.msg === 'queue_status') {
            const queuePos = evt.rank ?? evt.queue_size ?? '?'
            console.log(`HF queue position: ${queuePos}`)
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    throw new Error('Stream terminó sin resultado')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('tryon-free error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
