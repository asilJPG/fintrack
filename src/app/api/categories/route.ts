/**
 * GET /api/categories
 * Returns all categories for the given user_id.
 * Used by iPhone Shortcut integration.
 *
 * Auth: Bearer token (Supabase JWT) in Authorization header, OR
 *       ?api_key=<service-role-key> for simple shortcut usage.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  // Allow CORS for Shortcut
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, color')
      .or('is_default.eq.true')
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers })
    return NextResponse.json({ categories: data }, { headers })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
