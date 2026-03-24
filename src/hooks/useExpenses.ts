'use client'
/**
 * Hook for fetching and managing expenses with Supabase Realtime.
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

  const fetchExpenses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setExpenses((data as Expense[]) ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchExpenses()

    const channel = supabase
      .channel(`expenses-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
        payload => {
          setExpenses(prev => [payload.new as Expense, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
        payload => {
          setExpenses(prev => prev.map(e => (e.id === payload.new.id ? (payload.new as Expense) : e)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
        payload => {
          setExpenses(prev => prev.filter(e => e.id !== (payload.old as Expense).id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchExpenses])

  const addExpense = async (
    expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>
  ): Promise<{ data: Expense | null; error: string | null }> => {
    if (!user) return { data: null, error: 'Not authenticated' }
    const { data, error: err } = await supabase
      .from('expenses')
      .insert({ ...expense, user_id: user.id })
      .select()
      .single()
    return {
      data: data as Expense | null,
      error: err?.message ?? null,
    }
  }

  const updateExpense = async (
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: string | null }> => {
    const { error: err } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
    return { error: err?.message ?? null }
  }

  const deleteExpense = async (id: string): Promise<{ error: string | null }> => {
    const { error: err } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    return { error: err?.message ?? null }
  }

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  }
}
