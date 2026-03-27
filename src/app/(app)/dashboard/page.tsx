"use client";
import { useState, useEffect } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  calcDashboardStats,
  formatCompact,
  formatCurrency,
} from "@/lib/finance";
import StatCard from "@/components/StatCard";
import BurnCounter from "@/components/BurnCounter";
import { CategoryPieChart, DailyAreaChart } from "@/components/Charts";
import TransactionItem from "@/components/TransactionItem";
import AddExpenseModal from "@/components/AddExpenseModal";
import type { Profile, Expense } from "@/types/database";
import { Plus, TrendingUp, TrendingDown, Info } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { expenses, loading } = useExpenses();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"expense" | "income">("expense");
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  }, [user]);

  const currency = profile?.currency ?? "UZS";
  const stats = calcDashboardStats(expenses);
  const recent = expenses.slice(0, 8);

  // Проверяем есть ли доходы за этот месяц
  const hasIncome = stats.monthlyIncome > 0;

  const openModal = (type: "expense" | "income") => {
    setModalType(type);
    setEditExpense(null);
    setModalOpen(true);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Подсказка если нет доходов */}
      {!hasIncome && expenses.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="text-blue-300 font-semibold">Добавьте доход</span>
            <span className="text-white/50">
              {" "}
              — чтобы видеть реальные сбережения, добавьте вашу зарплату как
              транзакцию дохода
            </span>
            <button
              onClick={() => openModal("income")}
              className="ml-2 text-blue-400 underline hover:text-blue-300 font-medium"
            >
              Добавить доход →
            </button>
          </div>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openModal("expense")}
          className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-red-400">Добавить расход</p>
            <p className="text-xs text-white/30">Еда, транспорт...</p>
          </div>
        </button>

        <button
          onClick={() => openModal("income")}
          className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-green-400">Добавить доход</p>
            <p className="text-xs text-white/30">Зарплата, бонус...</p>
          </div>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Баланс"
          value={formatCompact(stats.totalBalance, currency)}
          sub="Доходы − Расходы"
          icon="💰"
          iconBg="bg-green-400/15"
          valueColor={
            stats.totalBalance >= 0 ? "text-green-400" : "text-red-400"
          }
          trend={stats.totalBalance >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Доход (месяц)"
          value={formatCompact(stats.monthlyIncome, currency)}
          sub={hasIncome ? "Этот месяц" : "Не добавлен"}
          icon="📥"
          iconBg="bg-blue-400/15"
          valueColor="text-blue-300"
          trend="up"
        />
        <StatCard
          label="Расходы (месяц)"
          value={formatCompact(stats.monthlyExpenses, currency)}
          sub="Этот месяц"
          icon="📤"
          iconBg="bg-red-400/15"
          valueColor="text-red-400"
          trend="down"
        />
        <StatCard
          label="Сбережения"
          value={
            hasIncome ? formatCompact(stats.monthlySavings, currency) : "—"
          }
          sub={
            hasIncome
              ? `${Math.max(0, stats.savingsRate).toFixed(0)}% от дохода`
              : "Добавьте доход"
          }
          icon="🏦"
          iconBg="bg-brand-500/15"
          valueColor={
            stats.monthlySavings >= 0 ? "text-brand-300" : "text-red-400"
          }
          trend={stats.monthlySavings >= 0 ? "up" : "down"}
        />
      </div>

      {/* Burn counter — только если есть расходы */}
      {stats.monthlyExpenses > 0 && (
        <BurnCounter
          monthlyExpenses={stats.monthlyExpenses}
          monthlyIncome={stats.monthlyIncome}
          currency={currency}
        />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
            По категориям
          </p>
          <CategoryPieChart expenses={expenses} />
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
            По дням месяца
          </p>
          <DailyAreaChart expenses={expenses} />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Последние транзакции
          </p>
          <a
            href="/expenses"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium"
          >
            Все →
          </a>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-white/40 text-sm mb-4">Нет транзакций</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => openModal("expense")}
                className="btn-ghost text-sm py-2"
              >
                <Plus className="w-3.5 h-3.5" /> Расход
              </button>
              <button
                onClick={() => openModal("income")}
                className="text-sm py-2 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-1.5 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Доход
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <TransactionItem
                key={e.id}
                expense={e}
                currency={currency}
                onEdit={(exp) => {
                  setEditExpense(exp);
                  setModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AddExpenseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditExpense(null);
        }}
        editExpense={editExpense}
        defaultType={modalType}
      />
    </div>
  );
}
