"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/types/database";
import { useAuth } from "./useAuth";

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "food",
    user_id: null,
    name: "Еда",
    icon: "🍔",
    color: "#ff9f43",
    is_default: true,
    created_at: "",
  },
  {
    id: "transport",
    user_id: null,
    name: "Транспорт",
    icon: "🚗",
    color: "#00b4d8",
    is_default: true,
    created_at: "",
  },
  {
    id: "shopping",
    user_id: null,
    name: "Покупки",
    icon: "🛍️",
    color: "#f72585",
    is_default: true,
    created_at: "",
  },
  {
    id: "entertainment",
    user_id: null,
    name: "Развлечения",
    icon: "🎮",
    color: "#7209b7",
    is_default: true,
    created_at: "",
  },
  {
    id: "subscriptions",
    user_id: null,
    name: "Подписки",
    icon: "📺",
    color: "#4cc9f0",
    is_default: true,
    created_at: "",
  },
  {
    id: "rent",
    user_id: null,
    name: "Аренда",
    icon: "🏠",
    color: "#6c63ff",
    is_default: true,
    created_at: "",
  },
  {
    id: "health",
    user_id: null,
    name: "Здоровье",
    icon: "💊",
    color: "#00d68f",
    is_default: true,
    created_at: "",
  },
  {
    id: "lokmaco",
    user_id: null,
    name: "Lokmaco",
    icon: "🍽️",
    color: "#e76f51",
    is_default: true,
    created_at: "",
  },
  {
    id: "office",
    user_id: null,
    name: "Офис",
    icon: "🏢",
    color: "#457b9d",
    is_default: true,
    created_at: "",
  },
  {
    id: "other",
    user_id: null,
    name: "Другое",
    icon: "📦",
    color: "#888899",
    is_default: true,
    created_at: "",
  },
];

export function findCategory(hint: string): Category {
  if (!hint) return DEFAULT_CATEGORIES.find((c) => c.id === "other")!;
  const lower = hint.toLowerCase();
  return (
    DEFAULT_CATEGORIES.find((c) => c.id === lower) ??
    DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase().startsWith(lower)) ??
    DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase().includes(lower)) ??
    DEFAULT_CATEGORIES.find((c) => c.id === "other")!
  );
}

export function useCategories() {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }) => {
        setCustomCategories((data as Category[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const categories: Category[] = [...DEFAULT_CATEGORIES, ...customCategories];

  const addCategory = async (cat: {
    name: string;
    icon: string;
    color: string;
  }) => {
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabase
      .from("categories")
      .insert({ ...cat, user_id: user.id, is_default: false })
      .select()
      .single();
    if (!error && data)
      setCustomCategories((prev) => [...prev, data as Category]);
    return { error: error?.message ?? null };
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return { categories, loading, addCategory, deleteCategory };
}
