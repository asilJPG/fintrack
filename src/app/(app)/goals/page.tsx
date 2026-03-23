"use client";
/**
 * Financial goals page.
 * Users can create, update, and delete savings goals with progress bars.
 */
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { calcGoalETA } from "@/lib/finance";
import type { Goal } from "@/types/database";
import clsx from "clsx";

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const deleteGoal = async (id: string) => {
    if (!confirm("Удалить цель?")) return;
    await supabase.from("goals").delete().eq("id", id);
    setGoals((g) => g.filter((x) => x.id !== id));
  };

  const openAdd = () => {
    setEditGoal(null);
    setModalOpen(true);
  };
  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setModalOpen(true);
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Финансовые цели</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Отслеживайте прогресс к мечте
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Новая цель
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-white/60">Нет целей</p>
          <p className="text-sm text-white/30 mt-1">
            Создайте первую цель — путешествие, ноутбук или фонд
          </p>
          <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
            Создать цель
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(
              100,
              (g.current_amount / g.target_amount) * 100,
            );
            const eta = calcGoalETA(
              g.target_amount,
              g.current_amount,
              g.monthly_contribution,
            );
            return (
              <div key={g.id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{g.emoji}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(g)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-base mb-0.5">{g.name}</h3>
                <p className="text-xs text-white/30 mb-3">
                  Цель: ${g.target_amount.toLocaleString()}
                </p>

                {/* Amount display */}
                <div className="flex items-end justify-between mb-2">
                  <span className="font-mono text-xl font-bold text-brand-300">
                    ${g.current_amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-white/30">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-xs text-white/30">
                  {g.completed ? "✅ Достигнута!" : `📅 ${eta}`}
                </p>
                {g.monthly_contribution > 0 && (
                  <p className="text-xs text-white/25 mt-0.5">
                    Взнос: ${g.monthly_contribution}/мес
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <GoalModal
          goal={editGoal}
          userId={user?.id ?? ""}
          onClose={() => {
            setModalOpen(false);
            setEditGoal(null);
            fetchGoals();
          }}
        />
      )}
    </div>
  );
}

/* ---- Goal Modal ---- */
function GoalModal({
  goal,
  userId,
  onClose,
}: {
  goal: Goal | null;
  userId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: goal?.name ?? "",
    emoji: goal?.emoji ?? "🎯",
    target_amount: String(goal?.target_amount ?? ""),
    current_amount: String(goal?.current_amount ?? "0"),
    monthly_contribution: String(goal?.monthly_contribution ?? ""),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      emoji: form.emoji,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      monthly_contribution: parseFloat(form.monthly_contribution) || 0,
      user_id: userId,
    };
    if (goal) {
      await supabase.from<any>("goals").update(payload).eq("id", goal.id);
    } else {
      await supabase.from<any>("goals").insert(payload);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1c1c26] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-bold">
            {goal ? "Редактировать цель" : "Новая цель"}
          </h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-3">
            <div>
              <label className="label">Эмодзи</label>
              <input
                className="input w-16 text-center text-xl"
                value={form.emoji}
                maxLength={2}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emoji: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="label">Название</label>
              <input
                className="input"
                placeholder="Купить MacBook"
                value={form.name}
                required
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Целевая сумма ($)</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="1200"
              value={form.target_amount}
              required
              onChange={(e) =>
                setForm((f) => ({ ...f, target_amount: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Уже накоплено ($)</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="0"
              value={form.current_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, current_amount: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Ежемесячный взнос ($)</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="200"
              value={form.monthly_contribution}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthly_contribution: e.target.value }))
              }
            />
          </div>
          <button
            className="btn-primary w-full justify-center py-3"
            type="submit"
            disabled={saving}
          >
            {saving ? "Сохраняем..." : goal ? "Сохранить" : "Создать"}
          </button>
        </form>
      </div>
    </div>
  );
}
