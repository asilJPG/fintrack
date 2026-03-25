/**
 * Finance utility functions used throughout the app.
 */
import type { Expense, DashboardStats, ChartDataPoint } from '@/types/database'
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, addMonths } from 'date-fns'

/** Currency symbols */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  KZT: '₸',
  UZS: 'sum',
  GBP: '£',
}

/** Format number as currency */
export function formatCurrency(amount: number, currency = 'UZS'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  if (currency === 'UZS') {
    return `${Math.round(amount).toLocaleString('ru-RU')} ${symbol}`
  }
  if (Math.abs(amount) >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`
  return `${symbol}${amount.toFixed(2)}`
}

/** Format compact - for stat cards */
export function formatCompact(amount: number, currency = 'UZS'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  if (currency === 'UZS') {
    if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} млрд ${symbol}`
    if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} млн ${symbol}`
    if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)} тыс ${symbol}`
    return `${Math.round(amount).toLocaleString('ru-RU')} ${symbol}`
  }
  if (Math.abs(amount) >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`
  return `${symbol}${amount.toFixed(2)}`
}

/** Format burn rate per second/minute/hour/day */
export function formatBurn(amount: number, currency = 'UZS'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  if (currency === 'UZS') {
    if (amount >= 1000) return `${Math.round(amount).toLocaleString('ru-RU')} ${symbol}`
    if (amount >= 1) return `${amount.toFixed(0)} ${symbol}`
    return `${amount.toFixed(2)} ${symbol}`
  }
  return `${symbol}${amount.toFixed(4)}`
}

/** Calculate dashboard stats from a list of expenses */
export function calcDashboardStats(expenses: Expense[], monthlyIncome: number): DashboardStats {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonth = expenses.filter(e => {
    const d = parseISO(e.date)
    return isWithinInterval(d, { start: monthStart, end: monthEnd })
  })

  const monthlyExpenses = thisMonth
    .filter(e => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0)

  const monthlyIncomeTx = thisMonth
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0)

  const effectiveIncome = monthlyIncomeTx > 0 ? monthlyIncomeTx : monthlyIncome
  const monthlySavings = effectiveIncome - monthlyExpenses
  const savingsRate = effectiveIncome > 0 ? (monthlySavings / effectiveIncome) * 100 : 0

  const burnPerSecond = monthlyExpenses / 2_592_000
  const burnPerMinute = burnPerSecond * 60
  const burnPerHour = burnPerSecond * 3600
  const burnPerDay = burnPerSecond * 86400

  const allIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const allExpenses = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const totalBalance = monthlyIncome * 3 + allIncome - allExpenses

  return {
    totalBalance: Math.max(0, totalBalance),
    monthlyIncome: effectiveIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    burnPerSecond,
    burnPerMinute,
    burnPerHour,
    burnPerDay,
  }
}

/** Group expenses by category for pie chart */
export function groupByCategory(expenses: Expense[]): ChartDataPoint[] {
  const map: Record<string, number> = {}
  expenses.filter(e => e.type === 'expense').forEach(e => {
    const key = e.category_name || 'Другое'
    map[key] = (map[key] || 0) + e.amount
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/** Group expenses by day for the current month */
export function groupByDay(expenses: Expense[]): { date: string; expenses: number; income: number }[] {
  const now = new Date()
  const days: Record<string, { expenses: number; income: number }> = {}

  expenses.forEach(e => {
    const d = parseISO(e.date)
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const key = format(d, 'dd MMM')
      if (!days[key]) days[key] = { expenses: 0, income: 0 }
      if (e.type === 'expense') days[key].expenses += e.amount
      else days[key].income += e.amount
    }
  })

  return Object.entries(days).map(([date, v]) => ({ date, ...v }))
}

/** Parse quick-add string: "25000 еда обед" → { amount, categoryHint, note } */
export function parseQuickAdd(input: string): { amount: number; categoryHint: string; note: string } | null {
  const trimmed = input.trim()
  const match = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
  if (!match) return null
  const amount = parseFloat(match[1].replace(',', '.'))
  const rest = match[2].trim().split(' ')
  const categoryHint = rest[0] || ''
  const note = rest.slice(1).join(' ')
  return { amount, categoryHint, note }
}

/** Calculate goal ETA */
export function calcGoalETA(targetAmount: number, currentAmount: number, monthlyContribution: number): string {
  if (monthlyContribution <= 0) return 'Не задан взнос'
  const remaining = targetAmount - currentAmount
  if (remaining <= 0) return 'Цель достигнута!'
  const months = Math.ceil(remaining / monthlyContribution)
  const eta = addMonths(new Date(), months)
  return `${format(eta, 'MMM yyyy')} (${months} мес.)`
}

/** Category colors */
export const CATEGORY_COLORS: Record<string, string> = {
  'Еда': '#ff9f43',
  'Транспорт': '#00b4d8',
  'Покупки': '#f72585',
  'Развлечения': '#7209b7',
  'Подписки': '#4cc9f0',
  'Аренда': '#6c63ff',
  'Здоровье': '#00d68f',
  'Зарплата': '#22c55e',
  'Кафе': '#c77dff',
  'Образование': '#f4a261',
  'Спорт': '#2ec4b6',
  'Другое': '#888899',
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] || '#6c63ff'
}
