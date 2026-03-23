'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp } from 'lucide-react'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Пароли не совпадают'); return }
    if (form.password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.name)
    setLoading(false)
    if (error) setError(error)
    else setSuccess(true)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold mb-2">Проверьте почту</h2>
        <p className="text-white/50 text-sm mb-6">Мы отправили ссылку подтверждения на <strong className="text-white">{form.email}</strong></p>
        <Link href="/auth/login" className="btn-primary justify-center">Войти</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md animate-fade-in relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500/20 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FinTrack</h1>
          <p className="text-white/40 mt-1 text-sm">Создайте аккаунт бесплатно</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-bold mb-6">Регистрация</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Имя</label>
              <input className="input" placeholder="Иван Иванов" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="label">Подтвердите пароль</label>
              <input className="input" type="password" placeholder="••••••••" value={form.confirm}
                onChange={e => setForm({...form, confirm: e.target.value})} required />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>}
            <button className="btn-primary w-full justify-center py-3" type="submit" disabled={loading}>
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-white/30 mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Войти</Link>
        </p>
      </div>
    </div>
  )
}
