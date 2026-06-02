import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const EXPENSE_CATEGORIES = [
  { name: "Еда" },
  { name: "Транспорт" },
  { name: "Покупки" },
  { name: "Развлечения" },
  { name: "Подписки" },
  { name: "Аренда" },
  { name: "Здоровье" },
  { name: "Lokmaco" },
  { name: "Офис" },
  { name: "Другое" },
];

export async function GET(req: NextRequest) {
  try {
    const { data } = await supabaseAdmin
      .from("categories")
      .select("name")
      .eq("is_default", true)
      .order("name");

    if (data && data.length > 0) {
      const items = (data as any[])
        .filter((c) => c.name !== "Зарплата")
        .map((c) => ({ name: c.name }));
      return NextResponse.json(items, { headers: CORS });
    }

    return NextResponse.json(EXPENSE_CATEGORIES, { headers: CORS });
  } catch (e) {
    return NextResponse.json(EXPENSE_CATEGORIES, { headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}
