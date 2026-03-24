'use client'
/**
 * Achievements / Gamification page.
 */
import { useEffect, useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { calcDashboardStats } from '@/lib/finance'
import clsx from 'clsx'

interface AchievementDef {
  key: string
  emoji: string
  name: string
  desc: string
  check: (data: AchievementData) => boolean
}

interface AchievementData {
  totalExpenses: number
  savings: number
  monthlyExpenses: number
  monthlyIncome: number
  savingsRate: number
  goalsCount: number
  usedAI: boolean
  scannedReceipt: boolean
  uniqueCategories: number
}

const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_expense',   emoji: '🐣', name: 'Первый шаг',       desc: 'Добавил первый расход',        check: d => d.totalExpenses > 0 },
  { key: 'saved_100',       emoji: '💰', name: 'Первая сотня',     desc: 'Сберёг $100 за месяц',         check: d => d.savings >= 100 },
  { key: 'saved_500',       emoji: '💎', name: 'Накопитель',       desc: 'Сберёг $500 за месяц',         check: d => d.savings >= 500 },
  { key: 'under_budget',    emoji: '🦸', name: 'Бюджетный герой',  desc: 'Расходы < доходов за месяц',   check: d => d.monthlyExpenses < d.monthlyIncome && d.monthlyIncome > 0 },
  { key: 'savings_rate_20', emoji: '📈', name: '20% правило',      desc: 'Норма сбережений ≥ 20%',       check: d => d.savingsRate >= 20 },
  { key: 'ten_expenses',    emoji: '✍️', name: 'Трекер',           desc: 'Добавил 10+ транзакций',       check: d => d.totalExpenses >= 10 },
  { key: 'fifty_expenses',  emoji: '📊', name: 'Аналитик',         desc: 'Добавил 50+ транзакций',       check: d => d.totalExpenses >= 50 },
  { key: 'receipt_scanned', emoji: '📷', name: 'Сканер',           desc: 'Отсканировал первый чек',      check: d => d.scannedReceipt },
  { key: 'all_categories',  emoji: '🌈', name: 'Разнообразный',   desc: 'Использовал 5+ категорий',     check: d => d.uniqueCategories >= 5 },
  { key: 'no_splurge',      emoji: '🧘', name: 'Дисциплина',       desc: 'Сберёг > 30% в этом месяце',  check: d => d.savingsRate >= 30 },
  { key: 'goal_created',    emoji: '🎯', name: 'Целеустремлённый', desc: 'Создал первую цель',           check: d => d.goalsCount > 0 },
  { key: 'big_saver',       emoji: '🏦', name: 'Большой накопитель', desc: 'Сберёг > 50% дохода',       check: d => d.savingsRate >= 50 },
]

export default function AchievementsPage() {
  const { expenses } = useExpenses()
  const { user } = useAuth()
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('achievements')
      .select('achievement_key')
      .eq('user_id', user.id)
      .then(({ data }) => {
        // Cast to avoid TS inference issues with partial select
        const rows = (data ?? []) as Array<{ achievement_key: string }>
        setUnlocked(new Set(rows.map(r => r.achievement_key)))
        setLoading(false)
      })
  }, [user])

  // Check and unlock achievements based on current data
  useEffect(() => {
    if (!user || loading) return
    const stats = calcDashboardStats(expenses, 0)
    const uniqueCats = new Set(expenses.map(e => e.category_name).filter(Boolean)).size

    const data: AchievementData = {
      totalExpenses: expenses.length,
      savings: stats.monthlySavings,
      monthlyExpenses: stats.monthlyExpenses,
      monthlyIncome: stats.monthlyIncome,
      savingsRate: stats.savingsRate,
      goalsCount: 0,
      usedAI: false,
      scannedReceipt: expenses.some(e => e.receipt_url != null),
      uniqueCategories: uniqueCats,
    }

    ACHIEVEMENTS.forEach(async a => {
      if (!unlocked.has(a.key) && a.check(data)) {
        const { error } = await supabase
          .from('achievements')
          .upsert({ user_id: user.id, achievement_key: a.key }, { onConflict: 'user_id,achievement_key' })
        if (!error) {
          setUnlocked(prev => new Set([...prev, a.key]))
        }
      }
    })
  }, [expenses, user, loading, unlocked])

  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.has(a.key)).length

  return (
    <div className="max-w-3xl space-y-5">
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-400/15 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
        <div>
          <h2 className="text-xl font-bold">Достижения</h2>
          <p className="text-sm text-white/40">
            Разблокировано{' '}
            <span className="text-yellow-400 font-bold">{unlockedCount}</span>{' '}
            из {ACHIEVEMENTS.length}
          </p>
        </div>
        <div className="flex-1 ml-4 hidden sm:block">
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
              style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-1">
            {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% завершено
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map(a => {
          const isUnlocked = unlocked.has(a.key)
          return (
            <div
              key={a.key}
              className={clsx(
                'card p-4 text-center transition-all duration-300',
                isUnlocked
                  ? 'border-yellow-400/25 bg-yellow-400/[0.04] hover:border-yellow-400/40'
                  : 'opacity-40'
              )}
            >
              <div className="text-3xl mb-2">{isUnlocked ? a.emoji : '🔒'}</div>
              <p className={clsx('font-bold text-sm mb-1', isUnlocked ? 'text-white' : 'text-white/40')}>
                {a.name}
              </p>
              <p className="text-xs text-white/30">{a.desc}</p>
              {isUnlocked && (
                <span className="mt-2 inline-block text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                  ✓ Получено
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
