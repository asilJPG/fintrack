'use client'
import { useState, useEffect } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { calcDashboardStats, formatCompact, formatCurrency } from '@/lib/finance'
import StatCard from '@/components/StatCard'
import BurnCounter from '@/components/BurnCounter'
import { CategoryPieChart, DailyAreaChart } from '@/components/Charts'
import TransactionItem from '@/components/TransactionItem'
import AddExpenseModal from '@/components/AddExpenseModal'
import type { Profile, Expense } from '@/types/database'
import { Plus, TrendingUp, TrendingDown, Zap } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { expenses, loading } = useExpenses()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'expense' | 'income'>('expense')
  const [editExpense, setEditExpense] = useState<Expense | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data as Profile) })
  }, [user])

  const currency = profile?.currency ?? 'UZS'
  const stats = calcDashboardStats(expenses, profile?.monthly_income ?? 0)
  const recent = expenses.slice(0, 8)

  const openModal = (type: 'expense' | 'income') => {
    setModalType(type)
    setEditExpense(null)
    setModalOpen(true)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── QUICK ACTION BUTTONS ── */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => openModal('expense')}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-red-400">Расход</p>
            <p className="text-xs text-white/30">Добавить</p>
          </div>
          <Plus className="w-4 h-4 text-red-400 sm:hidden" />
        </button>

        <button
          onClick={() => openModal('income')}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-green-400">Доход</p>
            <p className="text-xs text-white/30">Добавить</p>
          </div>
          <Plus className="w-4 h-4 text-green-400 sm:hidden" />
        </button>

        <button
          onClick={() => openModal('expense')}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 hover:border-brand-500/40 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-brand-400">Быстро</p>
            <p className="text-xs text-white/30">Ввести</p>
          </div>
          <Zap className="w-4 h-4 text-brand-400 sm:hidden" />
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Баланс"
          value={formatCompact(stats.totalBalance, currency)}
          sub="Общий баланс"
          icon="💰" iconBg="bg-green-400/15" valueColor="text-green-400"
          trend="neutral"
        />
        <StatCard
          label="Доход (месяц)"
          value={formatCompact(stats.monthlyIncome, currency)}
          sub="Этот месяц"
          icon="📥" iconBg="bg-blue-400/15" valueColor="text-blue-300"
          trend="up"
        />
        <StatCard
          label="Расходы (месяц)"
          value={formatCompact(stats.monthlyExpenses, currency)}
          sub="Этот месяц"
          icon="📤" iconBg="bg-red-400/15" valueColor="text-red-400"
          trend="down"
        />
        <StatCard
          label="Сбережения"
          value={formatCompact(stats.monthlySavings, currency)}
          sub={`${stats.savingsRate.toFixed(0)}% от дохода`}
          icon="🏦" iconBg="bg-brand-500/15" valueColor="text-brand-300"
          trend={stats.monthlySavings >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* ── BURN COUNTER ── */}
      <BurnCounter
        monthlyExpenses={stats.monthlyExpenses}
        monthlyIncome={stats.monthlyIncome}
        currency={currency}
      />

      {/* ── CHARTS ── */}
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

      {/* ── RECENT TRANSACTIONS ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Последние транзакции</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('expense')}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Расход
            </button>
            <button
              onClick={() => openModal('income')}
              className="text-xs bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Доход
            </button>
            <a href="/expenses" className="text-xs text-brand-400 hover:text-brand-300 font-medium">Все →</a>
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-white/40 text-sm mb-3">Нет транзакций</p>
            <button onClick={() => openModal('expense')} className="btn-primary mx-auto text-sm py-2">
              <Plus className="w-4 h-4" /> Добавить первый расход
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(e => (
              <TransactionItem
                key={e.id}
                expense={e}
                currency={currency}
                onEdit={(exp) => { setEditExpense(exp); setModalOpen(true) }}
              />
            ))}
          </div>
        )}
      </div>

      <AddExpenseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditExpense(null) }}
        editExpense={editExpense}
        defaultType={modalType}
      />
    </div>
  )
}
