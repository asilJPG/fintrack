'use client'
/**
 * Hook for fetching categories (default + user-specific).
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database'
import { useAuth } from './useAuth'

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${user.id}`)
      .order('name')
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
  }, [user])

  const addCategory = async (cat: { name: string; icon: string; color: string }) => {
    if (!user) return
    const { data } = await supabase
      .from('categories')
      .insert({ ...cat, user_id: user.id, is_default: false })
      .select()
      .single()
    if (data) setCategories(prev => [...prev, data])
  }

  return { categories, loading, addCategory }
}
