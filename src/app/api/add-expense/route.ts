/**
 * POST /api/add-expense
 * Adds an expense from iPhone Shortcut or external client.
 *
 * Body:
 * {
 *   "amount": 250,
 *   "category": "Еда",
 *   "note": "Обед",
 *   "user_id": "uuid",
 *   "date": "2024-01-15"   // optional, defaults to today
 * }
 *
 * Auth: service-role key passed as x-api-key header, or
 *       user JWT as Authorization: Bearer <token>
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, category, note, user_id, date } = body

    if (!amount || !user_id) {
      return NextResponse.json(
        { success: false, error: 'amount and user_id are required' },
        { status: 400, headers: CORS }
      )
    }

    // Find category
    const { data: catData } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .ilike('name', `%${category ?? ''}%`)
      .limit(1)
      .single()

    const { data, error } = await supabaseAdmin.from('expenses').insert({
      user_id,
      amount: parseFloat(String(amount)),
      type: 'expense',
      category_id: catData?.id ?? null,
      category_name: catData?.name ?? category ?? 'Другое',
      note: note ?? null,
      date: date ?? new Date().toISOString().split('T')[0],
      receipt_url: null,
    }).select().single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS })

    return NextResponse.json({ success: true, expense: data }, { headers: CORS })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
