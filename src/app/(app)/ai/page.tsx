'use client'
/**
 * AI Analysis page.
 * Sends spending summary to Claude API and renders personalized insights.
 */
import { useState } from 'react'
import { Brain, Sparkles, RefreshCw } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { groupByCategory, calcDashboardStats } from '@/lib/finance'
import clsx from 'clsx'

interface Insight {
  icon: string
  title: string
  text: string
  tag: 'warning' | 'tip' | 'positive' | 'info' | 'alert'
}

export default function AIPage() {
  const { expenses } = useExpenses()
  const { user } = useAuth()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [analysed, setAnalysed] = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    setInsights([])

    // Build spending summary
    const catData = groupByCategory(expenses)
    const stats = calcDashboardStats(expenses, 4800)
    const summary = catData.map(c => `${c.name}: $${c.value.toFixed(2)}`).join(', ')

    const prompt = `Ты — персональный финансовый AI-советник. Проанализируй данные расходов и дай 6 конкретных советов на русском языке.

Данные пользователя:
- Ежемесячный доход: $${stats.monthlyIncome.toFixed(2)}
- Расходы за месяц: $${stats.monthlyExpenses.toFixed(2)}
- Норма сбережений: ${stats.savingsRate.toFixed(1)}%
- Расходы по категориям: ${summary || 'Данных нет'}

Верни ТОЛЬКО JSON массив из 6 объектов, без пояснений и markdown:
[{"icon":"эмодзи","title":"Заголовок","text":"2 предложения с конкретными цифрами","tag":"warning|tip|positive|info|alert"}]`

    try {
      const resp = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const { insights: raw } = await resp.json()
      setInsights(raw)
    } catch {
      // Fallback: local rule-based insights
      setInsights(buildLocalInsights(stats, catData))
    }
    setAnalysed(true)
    setLoading(false)
  }

  const TAG_STYLES: Record<string, string> = {
    warning: 'bg-orange-400/15 text-orange-400 border-orange-400/20',
    tip: 'bg-brand-500/15 text-brand-300 border-brand-500/20',
    positive: 'bg-green-400/15 text-green-400 border-green-400/20',
    info: 'bg-blue-400/15 text-blue-300 border-blue-400/20',
    alert: 'bg-red-400/15 text-red-400 border-red-400/20',
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header card */}
      <div className="card p-6 text-center">
        <div className="w-14 h-14 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Brain className="w-7 h-7 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold mb-1">AI Анализ расходов</h2>
        <p className="text-sm text-white/40 mb-5">
          Получите персональные советы по экономии на основе ваших данных
        </p>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="btn-primary mx-auto text-base py-3 px-6"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Анализируем...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {analysed ? 'Обновить анализ' : 'Запустить анализ'}</>
          )}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-white/[0.06] rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.06] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-full" />
                  <div className="h-3 bg-white/[0.04] rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {!loading && insights.map((ins, i) => (
        <div key={i} className="card-hover p-4 flex gap-3 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl flex-shrink-0">
            {ins.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-semibold text-sm">{ins.title}</p>
              <span className={clsx('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border', TAG_STYLES[ins.tag])}>
                {ins.tag}
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">{ins.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Local fallback when API is unavailable */
function buildLocalInsights(stats: any, catData: any[]): Insight[] {
  const ins: Insight[] = []
  if (stats.savingsRate < 20) ins.push({ icon:'⚠️', title:'Низкая норма сбережений', text:`Вы сберегаете только ${stats.savingsRate.toFixed(0)}% дохода. Финансовые эксперты рекомендуют 20% и более. Попробуйте правило 50/30/20.`, tag:'warning' })
  else ins.push({ icon:'🎉', title:'Отличная норма сбережений', text:`Вы сберегаете ${stats.savingsRate.toFixed(0)}% — выше рекомендуемого минимума 20%. Продолжайте в том же духе!`, tag:'positive' })
  const food = catData.find(c => c.name === 'Еда')
  if (food && stats.monthlyExpenses > 0 && (food.value / stats.monthlyExpenses) > 0.3)
    ins.push({ icon:'🍔', title:'Высокие расходы на еду', text:`Еда составляет ${((food.value/stats.monthlyExpenses)*100).toFixed(0)}% расходов. Готовка дома вместо доставки может сэкономить $100+/мес.`, tag:'tip' })
  ins.push({ icon:'📊', title:'Анализ структуры расходов', text:`Ваш топ категорий: ${catData.slice(0,3).map(c=>c.name).join(', ')}. Проверьте, соответствует ли распределение вашим приоритетам.`, tag:'info' })
  ins.push({ icon:'🎯', title:'Установите финансовые цели', text:'Перейдите в раздел "Цели" и создайте конкретные цели сбережений. Это увеличивает вероятность их достижения на 42%.', tag:'tip' })
  ins.push({ icon:'📈', title:'Прогноз на год', text:`При текущих расходах $${stats.monthlyExpenses.toFixed(0)}/мес вы потратите $${(stats.monthlyExpenses*12).toFixed(0)} за год. Урежьте 10% — сэкономите $${(stats.monthlyExpenses*12*0.1).toFixed(0)}.`, tag:'info' })
  return ins
}
