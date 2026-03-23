'use client'
/**
 * Main app layout: sidebar + top bar + content area.
 * Guards all /dashboard, /expenses, /goals, /ai, /settings routes.
 */
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, CreditCard, Target, Brain,
  Settings, LogOut, TrendingUp, Menu, X,
  Bell, Scan, Trophy, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/expenses',       icon: CreditCard,      label: 'Расходы' },
  { href: '/goals',          icon: Target,          label: 'Цели' },
  { href: '/ai',             icon: Brain,           label: 'AI Анализ',   badge: 'New' },
  { href: '/scanner',        icon: Scan,            label: 'Сканер чеков' },
  { href: '/achievements',   icon: Trophy,          label: 'Достижения' },
  { href: '/notifications',  icon: Bell,            label: 'Уведомления' },
  { href: '/settings',       icon: Settings,        label: 'Настройки' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading, router])

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const currentPage = NAV.find(n => pathname.startsWith(n.href))?.label ?? 'FinTrack'

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-60 bg-[#111118] border-r border-white/[0.07] z-50',
        'flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
          <div className="w-9 h-9 bg-brand-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-brand-400" />
          </div>
          <span className="font-bold text-lg tracking-tight">FinTrack</span>
          <button className="ml-auto lg:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  active
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                {active && <span className="absolute left-0 w-0.5 h-6 bg-brand-400 rounded-r-full" />}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-50" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-300">
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-white/30">Активен</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur border-b border-white/[0.07] px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-xl bg-white/[0.05] text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg tracking-tight">{currentPage}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/expenses" className="btn-ghost text-xs py-2 px-3 hidden sm:flex">
              + Добавить расход
            </Link>
            <Link href="/expenses" className="btn-primary text-xs py-2 px-3">
              Быстрый ввод
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
