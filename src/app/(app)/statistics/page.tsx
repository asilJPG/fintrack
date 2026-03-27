'use client'
import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { formatCurrency, getCategoryColor } from '@/lib/finance'
import { parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Profile } from '@/types/database'

type Period = 'week' | 'month' | 'last_month' | '3months' | 'custom'

const CAT_ICONS: Record<string, string> = {
  'Еда': '🍔', 'Транспорт': '🚗', 'Покупки': '🛍️', 'Развлечения': '🎮',
  'Подписки': '📺', 'Аренда': '🏠', 'Здоровье': '💊', 'Зарплата': '💰',
  'Кафе': '☕', 'Образование': '📚', 'Спорт': '🏃', 'Другое': '📦',
}

export default function StatisticsPage() {
  const { expenses } = useExpenses()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data as Profile) })
  }, [user])

  const currency = profile?.currency ?? 'UZS'

  // Определяем диапазон дат
  const { from, to } = useMemo(() => {
    const now = new Date()
    switch (period) {
      case 'week':
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) }
      case 'last_month':
        const lm = subMonths(now, 1)
        return { from: startOfMonth(lm), to: endOfMonth(lm) }
      case '3months':
        return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) }
      case 'custom':
        return {
          from: customFrom ? startOfDay(parseISO(customFrom)) : startOfMonth(now),
          to: customTo ? endOfDay(parseISO(customTo)) : endOfMonth(now),
        }
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) }
    }
  }, [period, customFrom, customTo])

  // Фильтруем расходы по периоду
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (e.type !== 'expense') return false
      const d = parseISO(e.date)
      return isWithinInterval(d, { start: from, end: to })
    })
  }, [expenses, from, to])

  // Группируем по категориям
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(e => {
      const key = e.category_name || 'Другое'
      map[key] = (map[key] || 0) + e.amount
    })
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered])

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const incomeTotal = expenses
    .filter(e => e.type === 'income' && isWithinInterval(parseISO(e.date), { start: from, end: to }))
    .reduce((s, e) => s + e.amount, 0)

  const PERIODS = [
    { key: 'week', label: 'Эта неделя' },
    { key: 'month', label: 'Этот месяц' },
    { key: 'last_month', label: 'Прошлый месяц' },
    { key: '3months', label: '3 месяца' },
    { key: 'custom', label: 'Свой период' },
  ] as const

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold">Статистика</h2>
        <p className="text-sm text-white/40 mt-0.5">
          {format(from, 'd MMM yyyy', { locale: ru })} — {format(to, 'd MMM yyyy', { locale: ru })}
        </p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              period === p.key
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">От</label>
            <input className="input" type="date" value={customFrom}
              onChange={e => setCustomFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">До</label>
            <input className="input" type="date" value={customTo}
              onChange={e => setCustomTo(e.target.value)} />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Расходы</p>
          <p className="font-bold text-red-400 text-sm">{formatCurrency(total, currency)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Доходы</p>
          <p className="font-bold text-green-400 text-sm">{formatCurrency(incomeTotal, currency)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Транзакций</p>
          <p className="font-bold text-white text-sm">{filtered.length}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {byCategory.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-white/40 text-sm">Нет расходов за этот период</p>
        </div>
      ) : (
        <div className="card p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
            Расходы по категориям
          </p>
          <div className="space-y-3">
            {byCategory.map(({ name, amount }) => {
              const pct = total > 0 ? (amount / total) * 100 : 0
              const color = getCategoryColor(name)
              const icon = CAT_ICONS[name] ?? '📦'
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{icon}</span>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/40 w-10 text-right">
                        {pct.toFixed(0)}%
                      </span>
                      <span className="font-mono text-sm font-semibold text-red-400 w-32 text-right">
                        {formatCurrency(amount, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div className="border-t border-white/[0.07] mt-4 pt-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-white/60">Итого</span>
            <span className="font-mono font-bold text-red-400">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
