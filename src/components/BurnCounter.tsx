'use client'
/**
 * Live burn counter that shows how fast money is being spent.
 * Updates every second using the burn rate formula:
 *   spending_per_second = monthly_expenses / 2_592_000
 */
import { useEffect, useState, useRef } from 'react'
import { Flame } from 'lucide-react'

interface Props {
  monthlyExpenses: number
  monthlyIncome: number
}

export default function BurnCounter({ monthlyExpenses, monthlyIncome }: Props) {
  const burnPerSec = monthlyExpenses / 2_592_000
  const incomePerSec = monthlyIncome / 2_592_000
  const netPerSec = incomePerSec - burnPerSec

  const [sessionSpent, setSessionSpent] = useState(0)
  const [tick, setTick] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setSessionSpent(0)
  }, [monthlyExpenses])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      setSessionSpent(burnPerSec * elapsed)
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [burnPerSec])

  const fmt = (n: number, decimals = 4) => `$${n.toFixed(decimals)}`

  const rates = [
    { label: 'в секунду', value: fmt(burnPerSec) },
    { label: 'в минуту',  value: fmt(burnPerSec * 60, 2) },
    { label: 'в час',     value: fmt(burnPerSec * 3600, 2) },
    { label: 'в день',    value: fmt(burnPerSec * 86400, 2) },
  ]

  return (
    <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-[#1a0a2e] to-[#0d0d1f] p-5 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-brand-500/5 to-transparent pointer-events-none" />

      <div className="flex items-center gap-2 mb-1">
        <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Сжигание денег</span>
      </div>
      <p className="text-xs text-white/40 mb-4">Ваши деньги тратятся прямо сейчас</p>

      {/* Rates grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {rates.map(r => (
          <div key={r.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center">
            <div className="font-mono text-base font-semibold text-red-400 animate-burn">{r.value}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Session counter */}
      <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-white/60 flex items-center gap-2">
        <span>⏱</span>
        <span>
          Пока вы на этой странице вы уже потратили{' '}
          <strong className="font-mono text-red-400">{fmt(sessionSpent)}</strong>
        </span>
      </div>

      {/* Income vs Spend */}
      <div className="mt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 space-y-1.5 text-sm">
        <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">Доход vs Расход / сек</p>
        <div className="flex justify-between">
          <span className="text-white/50">💰 Доход</span>
          <span className="font-mono text-green-400">+{fmt(incomePerSec)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">🔥 Расход</span>
          <span className="font-mono text-red-400">-{fmt(burnPerSec)}</span>
        </div>
        <div className="border-t border-white/[0.06] pt-1.5 flex justify-between font-semibold">
          <span className="text-white/70">Баланс</span>
          <span className={`font-mono ${netPerSec >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netPerSec >= 0 ? '+' : ''}{fmt(netPerSec)}
          </span>
        </div>
      </div>
    </div>
  )
}
