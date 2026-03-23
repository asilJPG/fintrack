'use client'
/**
 * Smart notifications page.
 * Generates alerts based on spending patterns.
 */
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { calcDashboardStats, groupByCategory } from '@/lib/finance'
import { useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import type { Profile } from '@/types/database'
import clsx from 'clsx'

interface Notif {
  id: string
  type: 'warning' | 'info' | 'danger' | 'success'
  title: string
  text: string
  time: string
}

export default function NotificationsPage() {
  const { expenses } = useExpenses()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
  }, [user])

  const stats = calcDashboardStats(expenses, profile?.monthly_income ?? 0)
  const catData = groupByCategory(expenses)

  /** Generate dynamic notifications from spending data */
  const notifications: Notif[] = []

  const pctSpent = stats.monthlyIncome > 0 ? stats.monthlyExpenses / stats.monthlyIncome : 0
  if (pctSpent > 0.9) notifications.push({ id:'overspend90', type:'danger', title:'⚠️ Критический расход', text:`Вы потратили ${(pctSpent*100).toFixed(0)}% месячного дохода. Осталось $${(stats.monthlyIncome - stats.monthlyExpenses).toFixed(2)}.`, time:'Сейчас' })
  else if (pctSpent > 0.7) notifications.push({ id:'overspend70', type:'warning', title:'🔔 Высокий расход', text:`Использовано ${(pctSpent*100).toFixed(0)}% бюджета. Следите за расходами до конца месяца.`, time:'Сейчас' })

  if (stats.savingsRate > 20) notifications.push({ id:'goodsavings', type:'success', title:'✅ Отличные сбережения', text:`Вы сберегаете ${stats.savingsRate.toFixed(0)}% дохода — выше рекомендуемых 20%. Так держать!`, time:'Сейчас' })

  const entertainment = catData.find(c => c.name === 'Развлечения')
  if (entertainment && stats.monthlyIncome > 0 && (entertainment.value / stats.monthlyIncome) > 0.15)
    notifications.push({ id:'ent_high', type:'warning', title:'🎮 Развлечения', text:`Расходы на развлечения: $${entertainment.value.toFixed(2)} (${((entertainment.value/stats.monthlyIncome)*100).toFixed(0)}% дохода). Рекомендуется не более 10%.`, time:'Сейчас' })

  notifications.push({ id:'sub_remind', type:'info', title:'📅 Подписки', text:'Проверьте раздел расходов — возможно, есть подписки которые вы больше не используете.', time:'Рекомендация' })

  if (expenses.length < 5) notifications.push({ id:'track_more', type:'info', title:'📊 Отслеживайте больше', text:'Добавляйте все расходы для точного анализа. Минимум 10 транзакций для AI-советов.', time:'Совет' })

  const visible = notifications.filter(n => !dismissed.has(n.id))

  const TYPE_STYLES: Record<string, string> = {
    warning: 'border-orange-400/20 bg-orange-400/[0.04]',
    info: 'border-blue-400/20 bg-blue-400/[0.04]',
    danger: 'border-red-400/20 bg-red-400/[0.04]',
    success: 'border-green-400/20 bg-green-400/[0.04]',
  }
  const DOT_COLORS: Record<string, string> = {
    warning: 'bg-orange-400', info: 'bg-blue-400', danger: 'bg-red-400', success: 'bg-green-400'
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Уведомления</h2>
          <p className="text-sm text-white/40 mt-0.5">{visible.length} активных алертов</p>
        </div>
        {visible.length > 0 && (
          <button
            onClick={() => setDismissed(new Set(notifications.map(n => n.id)))}
            className="btn-ghost text-xs"
          >
            <BellOff className="w-3.5 h-3.5" /> Закрыть все
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="font-semibold text-white/40">Нет уведомлений</p>
          <p className="text-sm text-white/20 mt-1">Все в порядке 👍</p>
        </div>
      ) : visible.map(n => (
        <div key={n.id} className={clsx('card border p-4 flex gap-3 animate-slide-up', TYPE_STYLES[n.type])}>
          <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ring-4 ring-offset-0', DOT_COLORS[n.type], `ring-${DOT_COLORS[n.type].replace('bg-','')}/20`)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{n.title}</p>
              <button onClick={() => setDismissed(prev => new Set([...prev, n.id]))} className="text-white/20 hover:text-white flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-white/50 mt-0.5 leading-relaxed">{n.text}</p>
            <p className="text-xs text-white/20 mt-1.5">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
