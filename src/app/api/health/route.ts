import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'FinTrack API',
    version: '1.0.0',
    endpoints: [
      'GET /api/categories',
      'POST /api/add-expense',
      'POST /api/ai-analysis',
      'POST /api/scan-receipt',
    ],
  })
}
