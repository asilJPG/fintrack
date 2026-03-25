import { NextRequest, NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const CATEGORIES = [
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
  // Возвращаем в формате который Shortcut понимает как список
  // Каждый элемент это объект с полем "name" — Shortcut умеет по ним итерировать
  const items = CATEGORIES.map(name => ({ name }))

  return NextResponse.json(items, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
