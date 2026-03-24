'use client'
/**
 * Settings: profile, income, categories management, iPhone Shortcut API info.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Plus, Save, Copy, Check, Trash2 } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function SettingsPage() {
  const { user } = useAuth()
  const { categories, addCategory, deleteCategory } = useCategories()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', monthly_income: '', currency: 'USD' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '#6c63ff' })
  const [addingCat, setAddingCat] = useState(false)
  const [catError, setCatError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as Profile
          setProfile(p)
          setForm({
            full_name: p.full_name ?? '',
            monthly_income: String(p.monthly_income ?? 0),
            currency: p.currency ?? 'USD',
          })
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
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const copyUserId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddCat = async () => {
    setCatError('')
    if (!newCat.name.trim()) { setCatError('Введите название'); return }
    setAddingCat(true)
    const result = await addCategory(newCat)
    setAddingCat(false)
    if (result && result.error) {
      setCatError(result.error)
    } else {
      setNewCat({ name: '', icon: '📦', color: '#6c63ff' })
    }
  }

  const customCategories = categories.filter(c => !c.is_default)
  const defaultCategories = categories.filter(c => c.is_default)

  return (
    <div className="max-w-xl space-y-6">
      {/* Profile */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-4">👤 Профиль</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">Имя</label>
            <input
              className="input"
              placeholder="Иван Иванов"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Ежемесячный доход ($)</label>
            <input
              className="input font-mono"
              type="number"
              min="0"
              step="0.01"
              placeholder="4800"
              value={form.monthly_income}
              onChange={e => setForm(f => ({ ...f, monthly_income: e.target.value }))}
            />
            <p className="text-xs text-white/25 mt-1">
              Нужен для расчёта нормы сбережений и счётчика сжигания денег
            </p>
          </div>
          <div>
            <label className="label">Валюта отображения</label>
            <select
              className="input"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            >
              <option value="USD">USD — Доллар США</option>
              <option value="EUR">EUR — Евро</option>
              <option value="RUB">RUB — Российский рубль</option>
              <option value="KZT">KZT — Казахстанский тенге</option>
              <option value="UZS">UZS — Узбекский сум</option>
              <option value="GBP">GBP — Британский фунт</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saved
              ? <><Check className="w-4 h-4 text-green-400" /> Сохранено!</>
              : <><Save className="w-4 h-4" /> {saving ? 'Сохраняем...' : 'Сохранить'}</>
            }
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-1">🏷️ Категории</h3>
        <p className="text-xs text-white/30 mb-4">
          Стандартные категории всегда доступны. Добавьте свои ниже.
        </p>

        {/* Default categories (read-only display) */}
        <p className="text-[11px] text-white/25 uppercase tracking-wider font-semibold mb-2">Стандартные</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {defaultCategories.map(cat => (
            <span
              key={cat.id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-white/[0.06] text-white/40"
            >
              {cat.icon} {cat.name}
            </span>
          ))}
        </div>

        {/* Custom categories */}
        {customCategories.length > 0 && (
          <>
            <p className="text-[11px] text-white/25 uppercase tracking-wider font-semibold mb-2">Мои категории</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {customCategories.map(cat => (
                <span
                  key={cat.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-white/[0.1] text-white/70 bg-white/[0.03]"
                >
                  {cat.icon} {cat.name}
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-white/20 hover:text-red-400 ml-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}

        {/* Add new category */}
        <p className="text-[11px] text-white/25 uppercase tracking-wider font-semibold mb-2">Добавить категорию</p>
        <div className="flex gap-2">
          <input
            className="input text-sm flex-1"
            placeholder="Название"
            value={newCat.name}
            onChange={e => setNewCat(c => ({ ...c, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCat() }}
          />
          <input
            className="input w-14 text-center text-lg"
            value={newCat.icon}
            maxLength={2}
            onChange={e => setNewCat(c => ({ ...c, icon: e.target.value }))}
            title="Эмодзи иконка"
          />
          <input
            className="input w-12 p-2 cursor-pointer"
            type="color"
            value={newCat.color}
            onChange={e => setNewCat(c => ({ ...c, color: e.target.value }))}
            title="Цвет"
          />
          <button
            onClick={handleAddCat}
            disabled={addingCat}
            className="btn-primary px-3"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {catError && <p className="text-red-400 text-xs mt-1.5">{catError}</p>}
      </div>

      {/* iPhone Shortcut API */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-1">📱 iPhone Shortcut API</h3>
        <p className="text-sm text-white/40 mb-4">
          Добавляйте расходы тройным касанием задней панели iPhone
        </p>

        <div className="space-y-3">
          <div>
            <label className="label">Ваш User ID (для Shortcut)</label>
            <div className="flex gap-2">
              <input
                className="input font-mono text-xs"
                value={user?.id ?? ''}
                readOnly
              />
              <button onClick={copyUserId} className="btn-ghost px-3 flex-shrink-0">
                {copied
                  ? <Check className="w-4 h-4 text-green-400" />
                  : <Copy className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          <div className="bg-[#111118] rounded-xl p-4 font-mono text-xs space-y-1.5 text-white/40">
            <p className="text-white/20 font-sans text-[10px] uppercase tracking-wider mb-2">API Endpoints</p>
            <p><span className="text-green-400">GET</span>  /api/categories</p>
            <p><span className="text-blue-400">POST</span> /api/add-expense</p>
            <p className="text-white/20 pt-1 font-sans">
              Body: {'{ amount, category, note, user_id }'}
            </p>
          </div>

          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
            <p className="font-semibold text-brand-300 text-sm mb-2">Настройка Shortcut</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-white/50">
              <li>Открыть приложение «Быстрые команды»</li>
              <li>Новая команда → Веб-запрос GET /api/categories</li>
              <li>Меню выбора категории из JSON ответа</li>
              <li>Запросить ввод числа (сумма)</li>
              <li>Веб-запрос POST /api/add-expense с JSON</li>
              <li>Настройки → Универсальный доступ → Касание задней панели</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-3">⚙️ Аккаунт</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Регистрация</span>
            <span>{new Date(user?.created_at ?? '').toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
