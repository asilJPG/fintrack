import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, category, note, user_id, date, time } = body

    if (!amount || !user_id) {
      return NextResponse.json(
        { success: false, error: 'amount and user_id are required' },
        { status: 400, headers: CORS }
      )
    }

    // Используем название категории напрямую — без поиска в БД
    const categoryName = category ? String(category).trim() : 'Другое'

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id,
        amount: parseFloat(String(amount)),
        type: 'expense',
        category_id: null,
        category_name: categoryName,
        note: note ? String(note).trim() : null,
        date: date ?? new Date().toISOString().split('T')[0],
        receipt_url: null,
        time: time ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: CORS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        expense: data,
        message: `Добавлено: ${categoryName} — ${amount} сум`,
      },
      { headers: CORS }
    )
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500, headers: CORS }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
