'use client'
/**
 * Expenses page: list of all transactions with filter/search,
 * quick-add bar, and edit/delete per row.
 */
import { useState, useMemo } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import TransactionItem from '@/components/TransactionItem'
import AddExpenseModal from '@/components/AddExpenseModal'
import type { Expense } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ExpensesPage() {
  const { expenses, loading } = useExpenses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !search ||
        e.note?.toLowerCase().includes(search.toLowerCase()) ||
        e.category_name?.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || e.type === typeFilter
      return matchSearch && matchType
    })
  }, [expenses, search, typeFilter])

  /** Group by date for display */
  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {}
    filtered.forEach(e => {
      const key = e.date
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (e: Expense) => { setEditTarget(e); setModalOpen(true) }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="input pl-9"
            placeholder="Поиск по заметке или категории..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Type filter */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
          {(['all','expense','income'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-xs font-semibold transition-all ${
                typeFilter === t ? 'bg-brand-500/20 text-brand-300' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'all' ? 'Все' : t === 'expense' ? '📤 Расходы' : '📥 Доходы'}
            </button>
          ))}
        </div>

        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {/* Transaction list grouped by date */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">💸</p>
          <p className="font-semibold text-white/60">Нет транзакций</p>
          <p className="text-sm text-white/30 mt-1">Добавьте первый расход или доход</p>
          <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      ) : grouped.map(([date, txs]) => (
        <div key={date}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">
              {format(parseISO(date), 'd MMMM yyyy', { locale: ru })}
            </p>
            <p className="text-xs font-mono text-white/30">
              {txs.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0).toFixed(2)} расходов
            </p>
          </div>
          <div className="space-y-1.5">
            {txs.map(e => <TransactionItem key={e.id} expense={e} onEdit={openEdit} />)}
          </div>
        </div>
      ))}

      <AddExpenseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        editExpense={editTarget}
      />
    </div>
  )
}
