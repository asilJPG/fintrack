/**
 * TypeScript types mirroring the Supabase database schema.
 */

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon: string
  color: string
  is_default: boolean
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  type: 'expense' | 'income'
  category_id: string | null
  category_name: string | null
  note: string | null
  date: string
  receipt_url: string | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  emoji: string
  target_amount: number
  current_amount: number
  monthly_contribution: number
  deadline: string | null
  completed: boolean
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_key: string
  unlocked_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  monthly_income: number
  currency: string
  avatar_url: string | null
  updated_at: string
}

export interface AchievementRow {
  achievement_key: string
}

/** Supabase Database type map for createClient generic */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at'>
        Update: Partial<Omit<Expense, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id'>>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at'>
        Update: Partial<Omit<Goal, 'id'>>
      }
      achievements: {
        Row: Achievement
        Insert: Omit<Achievement, 'id' | 'unlocked_at'>
        Update: Partial<Omit<Achievement, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

/** Dashboard stats derived from expenses */
export interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  burnPerSecond: number
  burnPerMinute: number
  burnPerHour: number
  burnPerDay: number
}

/** Chart data point */
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}
