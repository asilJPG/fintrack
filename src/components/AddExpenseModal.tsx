'use client'
/**
 * Modal for adding/editing an expense or income.
 * Supports quick-add parsing: "25000 еда обед в кафе"
 */
import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { useCategories } from '@/hooks/useCategories'
import { parseQuickAdd } from '@/lib/finance'
import type { Expense } from '@/types/database'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  editExpense?: Expense | null
}

const DEFAULT_FORM = {
  amount: '',
  type: 'expense' as 'expense' | 'income',
  category_id: '',
  category_name: '',
  note: '',
  date: new Date().toISOString().split('T')[0],
}

export default function AddExpenseModal({ open, onClose, editExpense }: Props) {
  const { addExpense, updateExpense } = useExpenses()
  const { categories } = useCategories()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [quickInput, setQuickInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editExpense) {
      setForm({
        amount: String(editExpense.amount),
        type: editExpense.type,
        category_id: editExpense.category_id ?? '',
        category_name: editExpense.category_name ?? '',
        note: editExpense.note ?? '',
        date: editExpense.date,
      })
    } else {
      setForm({ ...DEFAULT_FORM, date: new Date().toISOString().split('T')[0] })
      setQuickInput('')
    }
    setError('')
  }, [editExpense, open])

  /** Parse quick-add string and fill form */
  const handleQuickParse = () => {
    const parsed = parseQuickAdd(quickInput)
    if (!parsed) { setError('Формат: "сумма категория заметка"'); return }
    const cat = categories.find(c =>
      c.name.toLowerCase().startsWith(parsed.categoryHint.toLowerCase())
    )
    setForm(f => ({
      ...f,
      amount: String(parsed.amount),
      category_id: cat?.id ?? '',
      category_name: cat?.name ?? parsed.categoryHint,
      note: parsed.note,
    }))
    setQuickInput('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount))) { setError('Укажите сумму'); return }
    setSaving(true); setError('')
    const payload = {
      amount: parseFloat(form.amount),
      type: form.type,
      category_id: form.category_id || null,
      category_name: form.category_name || 'Другое',
      note: form.note || null,
      date: form.date,
      receipt_url: null,
    }
    if (editExpense) {
      const { error } = await updateExpense(editExpense.id, payload)
      if (error) setError(error)
      else onClose()
    } else {
      const { error } = await addExpense(payload)
      if (error) setError(error)
      else onClose()
    }
    setSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1c1c26] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-bold text-base">{editExpense ? 'Редактировать' : 'Добавить транзакцию'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick add */}
          {!editExpense && (
            <div>
              <label className="label flex items-center gap-1.5"><Zap className="w-3 h-3" /> Быстрый ввод</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder='25000 еда обед в кафе'
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuickParse()}
                />
                <button type="button" onClick={handleQuickParse} className="btn-primary py-2.5 px-4">
                  ↵
                </button>
              </div>
              <p className="text-xs text-white/25 mt-1">Формат: сумма категория заметка</p>
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="label">Тип</label>
            <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
              {(['expense','income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({...f, type: t}))}
                  className={clsx(
                    'flex-1 py-2.5 text-sm font-semibold transition-all',
                    form.type === t
                      ? t === 'expense'
                        ? 'bg-red-400/20 text-red-400'
                        : 'bg-green-400/20 text-green-400'
                      : 'text-white/30 hover:text-white/60'
                  )}
                >
                  {t === 'expense' ? '📤 Расход' : '📥 Доход'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Сумма</label>
            <input
              className="input text-lg font-mono"
              type="number" step="0.01" min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({...f, amount: e.target.value}))}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Категория</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({...f, category_id: cat.id, category_name: cat.name}))}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                    form.category_id === cat.id
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : 'border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white'
                  )}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label">Заметка</label>
            <input
              className="input"
              placeholder="Обед, такси, Netflix..."
              value={form.note}
              onChange={e => setForm(f => ({...f, note: e.target.value}))}
            />
          </div>

          {/* Date */}
          <div>
            <label className="label">Дата</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({...f, date: e.target.value}))}
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>}

          {/* Submit */}
          <form onSubmit={handleSubmit}>
            <button className="btn-primary w-full justify-center py-3 text-base" type="submit" disabled={saving} onClick={handleSubmit}>
              {saving ? 'Сохраняем...' : editExpense ? 'Сохранить' : 'Добавить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
