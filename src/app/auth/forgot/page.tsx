'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(error)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/auth/login" className="flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад
        </Link>
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-bold mb-2">Письмо отправлено</h2>
              <p className="text-white/50 text-sm">Проверьте почту и перейдите по ссылке для сброса пароля</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">Восстановление пароля</h2>
              <p className="text-white/50 text-sm mb-6">Введите email — отправим ссылку для сброса</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>}
                <button className="btn-primary w-full justify-center py-3" type="submit" disabled={loading}>
                  {loading ? 'Отправляем...' : 'Отправить ссылку'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
