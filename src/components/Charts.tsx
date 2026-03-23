'use client'
/**
 * Dashboard charts: pie chart by category + line chart by day.
 * Uses Recharts for rendering.
 */
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts'
import { getCategoryColor, groupByCategory, groupByDay } from '@/lib/finance'
import type { Expense } from '@/types/database'

interface Props {
  expenses: Expense[]
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CategoryPieChart({ expenses }: Props) {
  const data = groupByCategory(expenses)
  if (!data.length) return (
    <div className="flex items-center justify-center h-full text-white/30 text-sm">
      Нет данных за этот месяц
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={90}
          innerRadius={45}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={getCategoryColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [`$${v.toFixed(2)}`, '']}
          contentStyle={{ background: '#1c1c26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DailyAreaChart({ expenses }: Props) {
  const data = groupByDay(expenses)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d68f" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#1c1c26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, '']}
        />
        <Area type="monotone" dataKey="expenses" name="Расходы" stroke="#ff4d6d" strokeWidth={2} fill="url(#expGrad)" dot={false} />
        <Area type="monotone" dataKey="income" name="Доходы" stroke="#00d68f" strokeWidth={2} fill="url(#incGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
