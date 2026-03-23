'use client'
/**
 * Single transaction row with edit/delete actions.
 */
import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { getCategoryColor } from '@/lib/finance'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Expense } from '@/types/database'
import clsx from 'clsx'

interface Props {
  expense: Expense
  onEdit?: (e: Expense) => void
}

export default function TransactionItem({ expense: e, onEdit }: Props) {
  const { deleteExpense } = useExpenses()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Удалить транзакцию?')) return
    setDeleting(true)
    await deleteExpense(e.id)
  }

  const color = getCategoryColor(e.category_name ?? '')
  const isIncome = e.type === 'income'

  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]',
      'hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-150 group',
      deleting && 'opacity-40'
    )}>
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: color + '22' }}
      >
        {e.category_name === 'Еда' ? '🍔'
          : e.category_name === 'Транспорт' ? '🚗'
          : e.category_name === 'Покупки' ? '🛍️'
          : e.category_name === 'Развлечения' ? '🎮'
          : e.category_name === 'Подписки' ? '📺'
          : e.category_name === 'Аренда' ? '🏠'
          : e.category_name === 'Здоровье' ? '💊'
          : e.category_name === 'Зарплата' ? '💰'
          : '📦'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{e.note || e.category_name || 'Без описания'}</p>
        <p className="text-xs text-white/30 mt-0.5">
          {e.category_name} · {format(parseISO(e.date), 'd MMM yyyy', { locale: ru })}
        </p>
      </div>

      {/* Amount */}
      <span className={clsx(
        'font-mono text-sm font-semibold',
        isIncome ? 'text-green-400' : 'text-red-400'
      )}>
        {isIncome ? '+' : '-'}${e.amount.toFixed(2)}
      </span>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={() => onEdit(e)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
