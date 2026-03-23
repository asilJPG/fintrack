/**
 * POST /api/ai-analysis
 * Proxies request to Anthropic Claude API for spending analysis.
 * API key is kept server-side only.
 */
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

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
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await resp.json()
    const text = data.content?.map((b: any) => b.text ?? '').join('') ?? ''

    // Strip any markdown fences and parse
    const clean = text.replace(/```json|```/g, '').trim()
    const insights = JSON.parse(clean)

    return NextResponse.json({ insights })
  } catch (err) {
    console.error('AI analysis error:', err)
    return NextResponse.json({ error: 'AI analysis failed', insights: [] }, { status: 500 })
  }
}
