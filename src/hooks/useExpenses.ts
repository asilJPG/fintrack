'use client'
/**
 * Hook for fetching and managing expenses with Supabase Realtime.
 * Subscribes to INSERT/UPDATE/DELETE events and updates local state.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types/database'
import { useAuth } from './useAuth'

export function useExpenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Fetch all expenses for the current user */
  const fetchExpenses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setExpenses(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchExpenses()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setExpenses(prev => [payload.new as Expense, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new as Expense : e))
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setExpenses(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchExpenses])

  /** Add a new expense */
  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense, user_id: user.id })
      .select()
      .single()
    return { data, error: error?.message ?? null }
  }

  /** Update an existing expense */
  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { error } = await supabase.from('expenses').update(updates).eq('id', id)
    return { error: error?.message ?? null }
  }

  /** Delete an expense */
  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    return { error: error?.message ?? null }
  }

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses }
}
