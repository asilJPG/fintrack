'use client'
/**
 * Main dashboard: stats, charts, burn counter, recent transactions.
 * Fetches data via useExpenses (with Supabase Realtime updates).
 */
import { useState, useEffect } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { calcDashboardStats, formatCurrency, formatCompact } from '@/lib/finance'
import StatCard from '@/components/StatCard'
import BurnCounter from '@/components/BurnCounter'
import { CategoryPieChart, DailyAreaChart } from '@/components/Charts'
import TransactionItem from '@/components/TransactionItem'
import type { Profile } from '@/types/database'

export default function DashboardPage() {
  const { user } = useAuth()
  const { expenses, loading } = useExpenses()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  const stats = calcDashboardStats(expenses, profile?.monthly_income ?? 0)
  const recent = expenses.slice(0, 8)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Баланс"
          value={formatCompact(stats.totalBalance)}
          sub="Общий баланс"
          icon="💰" iconBg="bg-green-400/15" valueColor="text-green-400"
          trend="neutral"
        />
        <StatCard
          label="Доход (месяц)"
          value={formatCompact(stats.monthlyIncome)}
          sub="Этот месяц"
          icon="📥" iconBg="bg-blue-400/15" valueColor="text-blue-300"
          trend="up"
        />
        <StatCard
          label="Расходы (месяц)"
          value={formatCompact(stats.monthlyExpenses)}
          sub="Этот месяц"
          icon="📤" iconBg="bg-red-400/15" valueColor="text-red-400"
          trend="down"
        />
        <StatCard
          label="Сбережения"
          value={formatCompact(stats.monthlySavings)}
          sub={`${stats.savingsRate.toFixed(0)}% от дохода`}
          icon="🏦" iconBg="bg-brand-500/15" valueColor="text-brand-300"
          trend={stats.monthlySavings >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Burn counter */}
      <BurnCounter
        monthlyExpenses={stats.monthlyExpenses}
        monthlyIncome={stats.monthlyIncome}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Расходы по категориям</p>
          <CategoryPieChart expenses={expenses} />
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Расходы по дням</p>
          <DailyAreaChart expenses={expenses} />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Последние транзакции</p>
          <a href="/expenses" className="text-xs text-brand-400 hover:text-brand-300 font-medium">Все →</a>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-8">Нет транзакций. Добавьте первый расход!</p>
        ) : (
          <div className="space-y-2">
            {recent.map(e => <TransactionItem key={e.id} expense={e} />)}
          </div>
        )}
      </div>
    </div>
  )
}
