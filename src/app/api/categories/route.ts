import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Категории только для расходов (без доходных)
const EXPENSE_CATEGORY_NAMES = [
  'Еда',
  'Транспорт',
  'Покупки',
  'Развлечения',
  'Подписки',
  'Аренда',
  'Здоровье',
  'Кафе',
  'Образование',
  'Спорт',
  'Другое',
]

export async function GET(req: NextRequest) {
  try {
    // Сначала пробуем из БД
    const { data } = await supabaseAdmin
      .from('categories')
      .select('name')
      .eq('is_default', true)
      .order('name')

    let names: string[]

    if (data && data.length > 0) {
      // Фильтруем — только расходные категории
      names = (data as any[])
        .map(c => c.name as string)
        .filter(name => name !== 'Зарплата')
    } else {
      // Fallback — захардкоженный список
      names = EXPENSE_CATEGORY_NAMES
    }

    return NextResponse.json(
      { categories: names, count: names.length },
      { headers: CORS }
    )
  } catch (e) {
    // Fallback при ошибке
    return NextResponse.json(
      { categories: EXPENSE_CATEGORY_NAMES, count: EXPENSE_CATEGORY_NAMES.length },
      { headers: CORS }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
