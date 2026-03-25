"use client";
/**
 * Modal for adding/editing an expense or income.
 * Quick-add: type "2500 еда обед" → auto-fills all fields.
 */
import { useState, useEffect, useRef } from "react";
import { X, Zap, ChevronDown } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories, findCategory } from "@/hooks/useCategories";
import { parseQuickAdd } from "@/lib/finance";
import type { Expense, Category } from "@/types/database";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

interface FormState {
  amount: string;
  type: "expense" | "income";
  category: Category | null;
  note: string;
  date: string;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function defaultForm(): FormState {
  return {
    amount: "",
    type: "expense",
    category: null,
    note: "",
    date: todayStr(),
  };
}

export default function AddExpenseModal({ open, onClose, editExpense }: Props) {
  const { addExpense, updateExpense } = useExpenses();
  const { categories } = useCategories();
  const [form, setForm] = useState<FormState>(defaultForm());
  const [quickInput, setQuickInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (!open) return;
    if (editExpense) {
      const cat =
        categories.find((c) => c.name === editExpense.category_name) ?? null;
      setForm({
        amount: String(editExpense.amount),
        type: editExpense.type,
        category: cat,
        note: editExpense.note ?? "",
        date: editExpense.date,
      });
    } else {
      setForm(defaultForm());
      setQuickInput("");
    }
    setError("");
    setTimeout(() => amountRef.current?.focus(), 100);
  }, [open, editExpense]); // eslint-disable-line

  /** Parse quick-add string and fill form fields */
  const handleQuickParse = () => {
    const trimmed = quickInput.trim();
    if (!trimmed) return;
    const parsed = parseQuickAdd(trimmed);
    if (!parsed) {
      setError("Формат: сумма категория заметка (пример: 2500 еда обед)");
      return;
    }
    const cat = findCategory(parsed.categoryHint);
    setForm((f) => ({
      ...f,
      amount: String(parsed.amount),
      category: cat,
      note: parsed.note || f.note,
    }));
    setQuickInput("");
    setError("");
    amountRef.current?.focus();
  };

  const selectCategory = (cat: Category) => {
    setForm((f) => ({ ...f, category: cat }));
    setError("");
  };

  const handleSubmit = async () => {
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError("Введите корректную сумму");
      return;
    }
    setSaving(true);
    setError("");

    const cat = form.category ?? findCategory("other");
    const payload = {
      amount: parseFloat(form.amount),
      type: form.type,
      category_id: cat.is_default ? null : cat.id,
      category_name: cat.name,
      note: form.note.trim() || null,
      date: form.date,
      receipt_url: null,
    };

    let result: { error: string | null };
    if (editExpense) {
      result = await updateExpense(editExpense.id, payload);
    } else {
      const r = await addExpense(payload);
      result = { error: r.error };
    }

    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  if (!open) return null;

  // Split categories: income ones vs expense ones for display
  const incomeCategories = categories.filter(
    (c) =>
      c.id === "salary" ||
      c.name.toLowerCase().includes("доход") ||
      c.name.toLowerCase().includes("зарплат")
  );
  const expenseCategories = categories.filter(
    (c) => !incomeCategories.includes(c)
  );
  const displayCategories =
    form.type === "income"
      ? incomeCategories.concat(expenseCategories)
      : expenseCategories.concat(incomeCategories);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1c1c26] border border-white/[0.12] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <h2 className="font-bold text-base">
            {editExpense ? "✏️ Редактировать" : "➕ Добавить транзакцию"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Quick add - only for new expenses */}
          {!editExpense && (
            <div>
              <label className="label flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                Быстрый ввод
              </label>
              <div className="flex gap-2">
                <input
                  className="input flex-1 font-mono text-sm"
                  placeholder="2500 еда обед в кафе"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickParse();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleQuickParse}
                  className="btn-primary px-4 py-2.5 text-sm"
                >
                  ↵ Разобрать
                </button>
              </div>
              <p className="text-[11px] text-white/25 mt-1.5">
                Формат:{" "}
                <span className="text-white/40 font-mono">
                  сумма категория заметка
                </span>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20 font-medium">
                  или заполните вручную
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="label">Тип операции</label>
            <div className="flex rounded-xl overflow-hidden border border-white/[0.08] p-0.5 bg-white/[0.03]">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={clsx(
                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                    form.type === t
                      ? t === "expense"
                        ? "bg-red-500/20 text-red-400 shadow-sm"
                        : "bg-green-500/20 text-green-400 shadow-sm"
                      : "text-white/30 hover:text-white/60"
                  )}
                >
                  {t === "expense" ? "📤 Расход" : "📥 Доход"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Сумма</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-lg">
                $
              </span>
              <input
                ref={amountRef}
                className="input pl-8 text-xl font-mono font-bold"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
          </div>

          {/* Category picker */}
          <div>
            <label className="label">Категория</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all",
                    form.category?.id === cat.id
                      ? "border-brand-500 bg-brand-500/20 text-brand-300"
                      : "border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {form.category && (
              <p className="text-xs text-white/30 mt-1.5">
                Выбрано: {form.category.icon} {form.category.name}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="label">
              Заметка{" "}
              <span className="text-white/20 normal-case font-normal">
                (необязательно)
              </span>
            </label>
            <input
              className="input"
              placeholder="Обед, такси до офиса, Netflix..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="label">Дата</label>
            <input
              className="input"
              type="date"
              value={form.date}
              max={todayStr()}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            className={clsx(
              "w-full justify-center py-3 text-base font-semibold rounded-xl transition-all",
              form.type === "income"
                ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                : "btn-primary"
            )}
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving
              ? "Сохраняем..."
              : editExpense
              ? "💾 Сохранить"
              : form.type === "income"
              ? "📥 Добавить доход"
              : "📤 Добавить расход"}
          </button>
        </div>
      </div>
    </div>
  );
}
