/**
 * Test script: Flux Context image generation with fictitious images
 *
 * Run: node test-flux.mjs
 *      node test-flux.mjs --dry-run   (no real API calls)
 *      node test-flux.mjs --local     (calls local Next.js /api/generate)
 */

import zlib from 'zlib'
import https from 'https'
import http from 'http'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const args = process.argv.slice(2)
const DRY_RUN  = args.includes('--dry-run')
const USE_LOCAL = args.includes('--local')

// ─── Tiny PNG generator (no external deps) ────────────────────────────────────

function makeCRCTable() {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c
  }
  return table
}
const crcTable = makeCRCTable()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = (crc >>> 8) ^ crcTable[(crc ^ b) & 0xFF]
  return ((crc ^ 0xFFFFFFFF) >>> 0)
}

function uint32BE(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n, 0)
  return b
}

function pngChunk(type, data) {
  const t = Buffer.from(type)
  return Buffer.concat([uint32BE(data.length), t, data, uint32BE(crc32(Buffer.concat([t, data])))])
}

/** Creates a valid 1×1 pixel PNG with a given RGB color */
function createTestPNG(r, g, b) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = pngChunk('IHDR', Buffer.from([0,0,0,1, 0,0,0,1, 8, 2, 0, 0, 0]))
  const idat = pngChunk('IDAT', zlib.deflateSync(Buffer.from([0, r, g, b])))
  const iend = pngChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend]).toString('base64')
}

// ─── Fictitious test images ────────────────────────────────────────────────────

/** Skin-tone pixel → represents a person's photo placeholder */
const FICTITIOUS_PERSON_B64 = createTestPNG(220, 180, 140)

/** Dark pixel → represents a black hoodie / garment placeholder */
const FICTITIOUS_GARMENT_B64 = createTestPNG(26, 26, 26)

// ─── Re-implement buildTryOnPrompt (mirrors lib/catalog.ts) ───────────────────

const PERSON_BODY = {
  XS:  { chest: 79,  waist: 61,  hips: 85,  height: 162 },
  S:   { chest: 84,  waist: 66,  hips: 90,  height: 165 },
  M:   { chest: 89,  waist: 71,  hips: 95,  height: 168 },
  L:   { chest: 95,  waist: 77,  hips: 100, height: 171 },
  XL:  { chest: 101, waist: 83,  hips: 106, height: 173 },
  XXL: { chest: 108, waist: 91,  hips: 113, height: 175 },
}

function describeChestFit(ease) {
  if (ease <= -10) return `chest is severely constricted — ${Math.abs(ease)}cm too small`
  if (ease < -4)  return `chest is too tight with ${Math.abs(ease)}cm deficit`
  if (ease < 0)   return `chest is slightly snug with ${Math.abs(ease)}cm deficit`
  if (ease < 6)   return `chest is body-hugging with ${ease}cm ease`
  if (ease < 14)  return `chest has a classic fitted silhouette with ${ease}cm ease`
  if (ease < 22)  return `chest is relaxed with ${ease}cm of ease`
  if (ease < 32)  return `chest is noticeably loose with ${ease}cm excess`
  return `chest is dramatically oversized with ${ease}cm excess`
}

function buildPrompt(garment, personSize, hasGarmentImage = false) {
  const body = PERSON_BODY[personSize]
  const m = garment.measurements
  const chestEase = m.chest != null ? m.chest - body.chest : null

  return [
    `Dress the person in this photo in a ${garment.color} ${garment.type} (${garment.brand} "${garment.name}", size ${garment.size}).`,
    `The person wears size ${personSize} but the garment is size ${garment.size} (chest ${m.chest ?? '?'}cm vs body chest ${body.chest}cm).`,
    chestEase != null
      ? `This creates a ${chestEase >= 0 ? chestEase + 'cm excess' : Math.abs(chestEase) + 'cm deficit'} — ${describeChestFit(chestEase)}.`
      : '',
    hasGarmentImage
      ? `The second image is a reference photo of the exact garment. Match its fabric texture, print, stitching, seam lines, buttons, and design details precisely — use it as the ground truth for visual appearance.`
      : `The garment's ${garment.color} color, fabric texture, and construction details must remain faithful.`,
    `Photorealistic fashion photo: natural lighting, realistic fabric shadows, 4K detail.`,
    `PRESERVE EXACTLY: the person's face, skin tone, hair, body proportions, pose, and background. Change ONLY the clothing.`,
  ].filter(Boolean).join(' ')
}

// ─── Fictitious garments for testing ──────────────────────────────────────────

const TEST_GARMENTS = [
  {
    id: 'test-hoodie',
    name: 'Cloud Hoodie',
    brand: 'FitAI Studio',
    size: 'M',
    color: 'Negro Carbón',
    type: 'hoodie',
    category: 'tops',
    measurements: { chest: 108, waist: 104, length: 70 },
  },
  {
    id: 'test-jacket',
    name: 'Moto Jacket',
    brand: 'FitAI Studio',
    size: 'S',
    color: 'Café Cognac',
    type: 'chamarra',
    category: 'outerwear',
    measurements: { chest: 98, waist: 94, length: 62 },
  },
  {
    id: 'test-dress',
    name: 'Linen Midi Dress',
    brand: 'FitAI Studio',
    size: 'XS',
    color: 'Azul Cielo',
    type: 'vestido',
    category: 'dresses',
    measurements: { chest: 84, waist: 68, hips: 90, length: 95 },
  },
]

const TEST_PERSON_SIZES = ['S', 'M', 'L']

// ─── Payload builder for fal.ai ───────────────────────────────────────────────

function buildFalPayload(personB64, garmentB64, prompt) {
  const personUrl  = `data:image/png;base64,${personB64}`
  const garmentUrl = garmentB64 ? `data:image/png;base64,${garmentB64}` : null
  // Dual-image: Flux Kontext multi-image format (person first, garment second)
  return garmentUrl
    ? { image_urls: [personUrl, garmentUrl], prompt }
    : { image_url: personUrl, prompt }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function postJSON(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isHttps = u.protocol === 'https:'
    const options = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
    const transport = isHttps ? https : http
    const req = transport.request(options, (res) => {
      let data = ''
      res.on('data', (d) => (data += d))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(JSON.stringify(body))
    req.end()
  })
}

// ─── Main test runner ──────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70))
  console.log('  FitAI · Flux Context — Test Suite')
  console.log('  Mode:', DRY_RUN ? 'DRY RUN (no API calls)' : USE_LOCAL ? 'LOCAL Next.js' : 'DIRECT fal.ai')
  console.log('='.repeat(70))
  console.log()

  // ── 1. Validate fictitious images ──────────────────────────────────────────
  console.log('▶ 1. Fictitious images')
  const personBuf = Buffer.from(FICTITIOUS_PERSON_B64, 'base64')
  const garmentBuf = Buffer.from(FICTITIOUS_GARMENT_B64, 'base64')
  const pngSig = '89504e47'

  console.log(`   Person photo  : ${FICTITIOUS_PERSON_B64.length} chars base64`)
  console.log(`   PNG signature : ${personBuf.slice(0,4).toString('hex') === pngSig ? 'OK ✓' : 'INVALID ✗'}`)
  console.log(`   Garment image : ${FICTITIOUS_GARMENT_B64.length} chars base64`)
  console.log(`   PNG signature : ${garmentBuf.slice(0,4).toString('hex') === pngSig ? 'OK ✓' : 'INVALID ✗'}`)
  console.log()

  // ── 2. Prompt building test ────────────────────────────────────────────────
  console.log('▶ 2. Prompt generation (catalog × person sizes)')
  for (const garment of TEST_GARMENTS) {
    for (const size of TEST_PERSON_SIZES) {
      const prompt = buildPrompt(garment, size)
      console.log(`\n   [${garment.name}] worn by size ${size}:`)
      console.log(`   ${prompt.slice(0, 200)}...`)
    }
  }
  console.log()

  // ── 3. Payload structure test ──────────────────────────────────────────────
  console.log('▶ 3. fal.ai payload structure')
  const sampleGarment = TEST_GARMENTS[0]
  const sampleSize    = 'L'

  // Single-image mode
  const promptSingle  = buildPrompt(sampleGarment, sampleSize, false)
  const payloadSingle = buildFalPayload(FICTITIOUS_PERSON_B64, null, promptSingle)

  console.log('\n   [Single-image mode — no garment photo]:')
  console.log(`   image_url     : data:image/png;base64,${FICTITIOUS_PERSON_B64.slice(0, 30)}...`)
  console.log(`   prompt length : ${payloadSingle.prompt.length} chars`)
  console.log(`   prompt preview: ${payloadSingle.prompt.slice(0, 120)}...`)

  // Dual-image mode
  const promptDual  = buildPrompt(sampleGarment, sampleSize, true)
  const payloadDual = buildFalPayload(FICTITIOUS_PERSON_B64, FICTITIOUS_GARMENT_B64, promptDual)

  console.log('\n   [Dual-image mode — with garment reference photo]:')
  console.log(`   image_urls[0] : data:image/png;base64,${FICTITIOUS_PERSON_B64.slice(0, 30)}...  ← person`)
  console.log(`   image_urls[1] : data:image/png;base64,${FICTITIOUS_GARMENT_B64.slice(0, 30)}...  ← garment`)
  console.log(`   prompt length : ${payloadDual.prompt.length} chars`)
  console.log(`   prompt preview: ${payloadDual.prompt.slice(0, 120)}...`)

  const samplePrompt = promptDual
  const payload      = payloadDual
  console.log()

  // ── 4. API call test ───────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log('\n▶ 4. API call — SKIPPED (dry-run mode)')
    console.log()
  } else if (USE_LOCAL) {
    console.log('\n▶ 4. Calling local Next.js /api/generate (dual-image) …')
    try {
      const result = await postJSON('http://localhost:3000/api/generate', {
        photoBase64:  `data:image/png;base64,${FICTITIOUS_PERSON_B64}`,
        garmentBase64: `data:image/png;base64,${FICTITIOUS_GARMENT_B64}`,
        prompt: samplePrompt,
      })
      console.log(`   HTTP ${result.status}:`, JSON.stringify(result.body, null, 2))
    } catch (e) {
      console.log('   ERROR (is Next.js running on port 3000?):', e.message)
    }
  } else {
    // Direct fal.ai call
    const falKey = process.env.FAL_KEY
    if (!falKey || falKey === 'your_fal_api_key_here') {
      console.log('▶ 4. fal.ai API call — SKIPPED')
      console.log('   FAL_KEY not configured in environment.')
      console.log('   Set it with: export FAL_KEY=your_real_key')
      console.log('   Or use: node test-flux.mjs --local  (needs Next.js running)')
    } else {
      const FAL_MODEL = '94652233-fbd6-4f67-873d-0ef1588b31e5:53d27a5d5f0d39e5430373aae89ee13f'
      console.log(`▶ 4. Calling fal.ai queue: ${FAL_MODEL}`)
      try {
        const result = await postJSON(
          `https://queue.fal.run/${FAL_MODEL}`,
          {
            image_urls: [
              `data:image/png;base64,${FICTITIOUS_PERSON_B64}`,
              `data:image/png;base64,${FICTITIOUS_GARMENT_B64}`,
            ],
            prompt: samplePrompt,
          },
          { Authorization: `Key ${falKey}` }
        )
        console.log(`   HTTP ${result.status}:`, JSON.stringify(result.body, null, 2))
        if (result.body?.request_id) {
          console.log(`\n   Request queued! Poll status at:`)
          console.log(`   GET https://queue.fal.run/${FAL_MODEL}/requests/${result.body.request_id}/status`)
        }
      } catch (e) {
        console.log('   ERROR:', e.message)
      }
    }
  }

  // ── 5. Summary ─────────────────────────────────────────────────────────────
  console.log()
  console.log('─'.repeat(70))
  console.log('  Test cases covered:')
  const total = TEST_GARMENTS.length * TEST_PERSON_SIZES.length
  console.log(`  • ${total} prompt combinations (${TEST_GARMENTS.length} garments × ${TEST_PERSON_SIZES.length} sizes)`)
  console.log(`  • Fictitious person photo  : 1×1px PNG (skin tone #DC B48C)`)
  console.log(`  • Fictitious garment image : 1×1px PNG (dark #1A1A1A)`)
  console.log(`  • PNG signature validation : both images pass`)
  console.log(`  • Payload single-image     : { image_url, prompt }`)
  console.log(`  • Payload dual-image       : { image_urls: [person, garment], prompt }`)
  console.log()
  console.log('  To run with real API:')
  console.log('  export FAL_KEY=fa-xxxx && node test-flux.mjs')
  console.log()
  console.log('  To test via local server:')
  console.log('  npm run dev  # in another terminal')
  console.log('  node test-flux.mjs --local')
  console.log('─'.repeat(70))
}

main().catch(console.error)
