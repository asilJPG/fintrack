'use client'
/**
 * Settings page: profile, monthly income, categories management, API key display.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Plus, Save, Copy, Check } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function SettingsPage() {
  const { user } = useAuth()
  const { categories, addCategory } = useCategories()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', monthly_income: '', currency: 'USD' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '#6c63ff' })
  const [addingCat, setAddingCat] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data)
        setForm({ full_name: data.full_name ?? '', monthly_income: String(data.monthly_income), currency: data.currency })
      }
    })
  }, [user])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      monthly_income: parseFloat(form.monthly_income) || 0,
      currency: form.currency,
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const copyUserId = () => {
    navigator.clipboard.writeText(user?.id ?? '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleAddCat = async () => {
    if (!newCat.name.trim()) return
    setAddingCat(true)
    await addCategory(newCat)
    setNewCat({ name: '', icon: '📦', color: '#6c63ff' })
    setAddingCat(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Profile */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-4">Профиль</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">Имя</label>
            <input className="input" placeholder="Иван Иванов" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Ежемесячный доход ($)</label>
            <input className="input font-mono" type="number" min="0" placeholder="4800"
              value={form.monthly_income}
              onChange={e => setForm(f => ({ ...f, monthly_income: e.target.value }))} />
            <p className="text-xs text-white/25 mt-1">Используется для расчёта нормы сбережений и счётчика сжигания</p>
          </div>
          <div>
            <label className="label">Валюта</label>
            <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              <option value="USD">USD — Доллар США</option>
              <option value="EUR">EUR — Евро</option>
              <option value="RUB">RUB — Рубль</option>
              <option value="KZT">KZT — Тенге</option>
              <option value="UZS">UZS — Сум</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saved ? <><Check className="w-4 h-4" /> Сохранено!</> : <><Save className="w-4 h-4" /> {saving ? 'Сохраняем...' : 'Сохранить'}</>}
          </button>
        </form>
      </div>

      {/* iPhone Shortcut API */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-1">iPhone Shortcut API</h3>
        <p className="text-sm text-white/40 mb-4">Добавляйте расходы тройным касанием спины iPhone</p>

        <div className="space-y-3">
          <div>
            <label className="label">Ваш User ID</label>
            <div className="flex gap-2">
              <input className="input font-mono text-xs" value={user?.id ?? ''} readOnly />
              <button onClick={copyUserId} className="btn-ghost px-3">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-[#111118] rounded-xl p-4 text-xs font-mono space-y-2 text-white/50">
            <p className="text-white/30 text-[11px] font-sans font-semibold uppercase tracking-wider mb-2">Эндпоинты Shortcut</p>
            <p><span className="text-green-400">GET</span> /api/categories</p>
            <p><span className="text-blue-400">POST</span> /api/add-expense</p>
            <p className="text-white/25 pt-1">Body: {`{ amount, category, note, user_id }`}</p>
          </div>

          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-sm text-white/60">
            <p className="font-semibold text-brand-300 mb-1">📱 Настройка Shortcut</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Создайте Shortcut в приложении «Быстрые команды»</li>
              <li>Добавьте действие «Запрос URL» → GET /api/categories</li>
              <li>Добавьте «Выбор из меню» → список категорий из JSON</li>
              <li>Добавьте «Запросить текст» для суммы</li>
              <li>POST /api/add-expense с JSON телом</li>
              <li>Привяжите к жесту «Тройное касание задней панели»</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-4">Категории</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <span key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] border border-white/[0.08]">
              {cat.icon} {cat.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input text-sm" placeholder="Название категории" value={newCat.name}
            onChange={e => setNewCat(c => ({ ...c, name: e.target.value }))} />
          <input className="input w-14 text-center text-base" value={newCat.icon} maxLength={2}
            onChange={e => setNewCat(c => ({ ...c, icon: e.target.value }))} />
          <button onClick={handleAddCat} disabled={addingCat} className="btn-primary px-3">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-2">Аккаунт</h3>
        <p className="text-sm text-white/40 mb-1">{user?.email}</p>
        <p className="text-xs text-white/20">Регистрация: {new Date(user?.created_at ?? '').toLocaleDateString('ru')}</p>
      </div>
    </div>
  )
}
