/**
 * POST /api/scan-receipt
 * Uses Claude vision to extract receipt data from an image.
 */
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { image, mimeType } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
            { type: 'text', text: 'Extract receipt data. Return ONLY JSON: {"store":"name","items":[{"name":"item","price":0.00}],"total":0.00}. No markdown.' }
          ]
        }]
      })
    })

    const data = await resp.json()
    const text = data.content?.map((b: any) => b.text ?? '').join('') ?? ''
    const receipt = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ receipt })
  } catch {
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
