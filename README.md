# FinTrack — Personal Finance Tracker

A full-stack personal finance web application built with **Next.js 14**, **Supabase**, and **AI-powered analysis**.

## ✨ Features

- 🔐 **Auth** — Email/password registration & login via Supabase Auth
- 💳 **Expense Tracking** — Add, edit, delete expenses with quick-add (`25000 еда`)
- 🔥 **Live Burn Counter** — Real-time spending rate per second/minute/hour/day
- 📊 **Dashboard Charts** — Category pie chart, daily area chart (Recharts)
- 🎯 **Financial Goals** — Progress bars + ETA calculation
- 🤖 **AI Analysis** — Claude-powered spending insights
- 📷 **Receipt Scanner** — OCR via Tesseract.js + Claude Vision
- 🏆 **Achievements** — Gamified badges unlocked by user behavior
- 🔔 **Smart Notifications** — Budget alerts based on real data
- 📱 **iPhone Shortcut API** — `GET /api/categories`, `POST /api/add-expense`
- 🌙 **Dark UI** — Modern fintech design, mobile-first

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd fintrack
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the full contents of `supabase-schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: for AI Analysis and Receipt OCR
ANTHROPIC_API_KEY=your-anthropic-key
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Production Deploy

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t fintrack .
docker run -p 3000:3000 --env-file .env.local fintrack
```

---

## 📱 iPhone Shortcut Setup

1. Open **Shortcuts** app on iPhone
2. Create new Shortcut
3. Add **"Get Contents of URL"** action:
   - URL: `https://your-domain.com/api/categories`
   - Method: GET
4. Add **"Get Dictionary from Input"** → get value for `categories`
5. Add **"Choose from List"** (show category names)
6. Add **"Ask for Input"** → Number → "Amount"
7. Add **"Get Contents of URL"**:
   - URL: `https://your-domain.com/api/add-expense`
   - Method: POST
   - Body JSON:
     ```json
     {
       "amount": [Input],
       "category": [Chosen category],
       "user_id": "your-user-id-from-settings",
       "note": ""
     }
     ```
8. Assign to **Back Tap → Triple Tap** in Settings → Accessibility

> Find your User ID in FinTrack → Settings → iPhone Shortcut API section.

---

## 🏗 Project Structure

```
fintrack/
├── src/
│   ├── app/
│   │   ├── (app)/                   # Protected routes (require auth)
│   │   │   ├── layout.tsx           # Sidebar + topbar layout
│   │   │   ├── dashboard/page.tsx   # Main dashboard
│   │   │   ├── expenses/page.tsx    # Transaction list
│   │   │   ├── goals/page.tsx       # Savings goals
│   │   │   ├── ai/page.tsx          # AI analysis
│   │   │   ├── scanner/page.tsx     # Receipt OCR
│   │   │   ├── achievements/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── categories/route.ts  # GET /api/categories (Shortcut)
│   │   │   ├── add-expense/route.ts # POST /api/add-expense (Shortcut)
│   │   │   ├── ai-analysis/route.ts # POST /api/ai-analysis
│   │   │   ├── scan-receipt/route.ts
│   │   │   └── health/route.ts
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot/page.tsx
│   │   ├── layout.tsx               # Root layout + AuthProvider
│   │   └── globals.css
│   ├── components/
│   │   ├── AddExpenseModal.tsx      # Add/edit expense dialog
│   │   ├── BurnCounter.tsx          # Live spending counter
│   │   ├── Charts.tsx               # Recharts pie + area charts
│   │   ├── StatCard.tsx             # KPI card
│   │   └── TransactionItem.tsx      # Single transaction row
│   ├── hooks/
│   │   ├── useAuth.tsx              # Auth context + hook
│   │   ├── useExpenses.ts           # Expenses + Realtime
│   │   └── useCategories.ts        # Categories hook
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client instances
│   │   └── finance.ts             # Calculations & utilities
│   └── types/
│       └── database.ts            # TypeScript types
├── supabase-schema.sql            # Full database schema + RLS
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔥 Burn Counter Formula

```
spending_per_second = monthly_expenses / 2,592,000
spending_per_minute = spending_per_second × 60
spending_per_hour   = spending_per_second × 3,600
spending_per_day    = spending_per_second × 86,400
```

---

## 🗄 Database Schema

| Table         | Description                        |
|---------------|------------------------------------|
| `profiles`    | User settings (income, currency)   |
| `expenses`    | All transactions (income/expense)  |
| `categories`  | Default + custom categories        |
| `goals`       | Savings goals with progress        |
| `achievements`| Unlocked gamification badges       |

All tables use **Row Level Security** — users only see their own data.

---

## 🤖 AI Analysis

Requires `ANTHROPIC_API_KEY`. Falls back to rule-based local insights if API key is not set.

---

## 📄 License

MIT
