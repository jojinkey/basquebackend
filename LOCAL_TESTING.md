# Basque — Local Testing Guide

Run both apps locally and test every feature before deploying. Both apps talk to
the **same live Supabase** (credentials are baked in as fallbacks), so local and
production share data — what you create locally appears on the deployed site too.

---

## One-time Supabase setup

Run these two SQL files **once** in Supabase → SQL Editor (if you haven't already):

1. `supabase-migration.sql` — seeds users, menu, tables, demo data, RLS, realtime
2. `supabase-functions.sql` — adds the `clear_all_data()` and `reset_demo_data()` admin functions

---

## 1. Manager OS (basquebackend)

```bash
cd C:\Users\jalaj\source\basquebackend
npm install        # first time only
npm run dev
```

Opens at **http://localhost:5173** (Vite will pick the next free port if busy).

### Login accounts
| Role | Credential |
|------|-----------|
| Owner | `owner@2024` |
| Restaurant Manager | `manager@24` |
| Floor Manager | `4455` |
| Server | `1122` |
| Kitchen | `7788` |

### What to test per role
- **Owner** → God View (KPIs, floor overview, pipeline), Settings → **Reset / Clear data buttons**
- **Restaurant Manager** → Reservations pipeline, Floor Plan, Kitchen, Waitlist, Insights, Audit
- **Floor Manager** → Floor Plan, Waitlist, Reservations (read-only), Service Alerts
- **Server** → Floor Plan (seat/clear tables), Table Ordering, Service Alerts
- **Kitchen** → Kitchen Display (Start → Ready), menu availability

---

## 2. Guest QR Menu (PWA)

While the Manager OS dev server is running, open a table menu directly:

```
http://localhost:5173/menu/T1
```

- Add items to cart → **Send Order** → order arrives as **Pending Approval**
- Log in as Owner/Manager → Kitchen Orders → **Approve** → it moves to NEW → Start → Ready
- The order badge also appears on the table card in **Floor Plan**
- **Call Waiter / Request Bill** → shows up in **Service Alerts**

---

## 3. Customer Website (basque-web)

```bash
cd C:\Users\jalaj\source\basque-web
npm install        # first time only
npm run dev
```

Opens at **http://localhost:5173** (or next free port).

- Submit any booking form (Table, Event, Golf, Golf & Dining)
- The lead appears live in the Manager OS **Reservations** pipeline (New Leads column)

> Run the two apps on different ports — Vite handles this automatically. If you
> want both at once, start basquebackend first, then basque-web (it will use the
> next port, e.g. 5174).

---

## Resetting between tests

In the Manager OS, log in as **Owner → Settings → Data Management**:

- **↺ Reset Demo Data** — restores the sample evening (7 seated tables, orders, waitlist, pipeline). Keeps real website reservations.
- **🗑 Clear All Data** — wipes everything (orders, sessions, waitlist, service requests, audit logs, **and all reservations**) and frees all 18 tables.

Both apply instantly to every connected device since they run against Supabase.

---

## Notes
- No `.env` is required — Supabase URL + anon key are hardcoded fallbacks in `src/lib/supabase.js`. To override, create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Realtime updates: orders, tables, service requests, waitlist, and reservations push live across all open tabs/devices.
