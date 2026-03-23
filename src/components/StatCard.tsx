/**
 * Reusable stat card for dashboard KPIs.
 */
import { ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  label: string
  value: string
  sub?: string
  icon: string
  iconBg: string
  valueColor?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ label, value, sub, icon, iconBg, valueColor = 'text-white', trend }: Props) {
  return (
    <div className="card-hover p-5 relative overflow-hidden group">
      {/* Icon */}
      <div className={clsx('absolute right-4 top-4 w-10 h-10 rounded-xl flex items-center justify-center text-lg', iconBg)}>
        {icon}
      </div>

      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{label}</p>
      <p className={clsx('font-mono text-2xl font-bold tracking-tight', valueColor)}>{value}</p>

      {sub && (
        <p className={clsx(
          'text-xs mt-1.5 flex items-center gap-1 font-medium',
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/30'
        )}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}
          {sub}
        </p>
      )}

      {/* Hover glow */}
      <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
    </div>
  )
}
