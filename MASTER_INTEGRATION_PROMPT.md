# BASQUE MANAGER OS - MASTER INTEGRATION PROMPT

> **Purpose**: This is a single, authoritative prompt to integrate three isolated branches (`menu`, `Floor-Management`, `waitlist`) into one unified, premium, role-authenticated Basque Restaurant Operating System.

---

## PROJECT CONTEXT

**Basque Dehradun** is a luxury heritage restaurant with:
- 4 sections: **Indoor** (T1-T7), **Terrace** (T8-T11), **Garden** (T12-T14), **Bar** (T15-T18)
- 18 tables, each with QR codes linking to `/menu/:tableId`
- A customer-facing website at `basque-web` that captures leads for Table Reservations, Events, Golf Simulator, Golf & Dining, and Pickleball
- All leads currently POST to `/api/leads` and populate a Google Sheet + WhatsApp notification

**Repository**: `https://github.com/jojinkey/basquebackend`
**Stack**: Vite 8 + React 19 + Framer Motion 12 + Socket.IO + MongoDB Atlas + Express 5
**Design Language**: Heritage luxury - warm creams, amber/gold accents, Cormorant Garamond + Cinzel + Jost fonts, grain texture overlays

---

## WHAT EXISTS TODAY (3 Branches)

### Branch 1: `menu` (Default Branch)
**What it does**: Full QR-based digital menu PWA + basic Manager Dashboard

| Component | Path | Purpose |
|-----------|------|---------|
| `MenuPage.jsx` | `/menu/:tableId` | Guest-facing PWA menu. Browse by category, add to cart, send order to kitchen via Socket.IO. Call Waiter & Request Bill buttons. Offline queue with localStorage sync. |
| `ManagerDashboard.jsx` | `/manager` | Basic order management. Kitchen Orders tab (New/Preparing/Served status), Floor Plan tab (12-table grid showing active orders), Service Requests tab (waiter calls + bill requests), basic Insights tab. |
| `backend/server.js` | Express + Socket.IO | MongoDB Atlas backend. Routes: `/api/menu` (CRUD), `/api/orders` (CRUD + socket emit), `/api/service-requests` (CRUD + socket emit). |
| `backend/models/` | Mongoose | `MenuItem` (name, price, desc, category, image, isAvailable), `Order` (tableId, tableName, items[], total, status), `ServiceRequest` (tableId, tableName, type, status) |
| `src/data/menuData.js` | Static data | 6 categories, 68 items with prices. Categories: Mango Mania, Soups & Salads, Appetizers, Pizza & Pasta, Indian & Tandoor, Cocktails |
| `src/services/orderApi.js` | API client | createOrder with offline fallback, syncOfflineOrders on reconnect |
| `src/services/socket.js` | Socket.IO client | Connects to localhost:5000, WebSocket transport |

**Key Socket Events**: `order:new`, `order:updated`, `order:deleted`, `service:new`, `service:updated`

### Branch 2: `Floor-Management`
**What it does**: Premium Floor Plan dashboard with section filtering, VIP indicators, and analytics

| Component | Path | Purpose |
|-----------|------|---------|
| `ManagerDashboard.jsx` | Root component | Sidebar nav (Floor Plan, Waitlist, Courts, Events, Insights). Section filter tabs (All/Indoor/Terrace/Garden/Bar). 7-column table grid with status-color-coded cards. VIP badge (gold star + border). Needs Bussing state (red). Stats top bar (Available, Seated, Avg Duration, Revenue, Avg Spend, Waitlist). CSV audit export. |
| `server.js` | Express API | In-memory 18-table dataset with sections, pax, status, guest names, seatedDuration, VIP flags, reservations. Endpoints: GET /api/tables, GET /api/stats, GET /api/waitlist, PUT /api/tables/:id/status, POST/DELETE /api/waitlist |

**Table Statuses**: `available`, `seated`, `reserved`, `needs_bussing`
**Card Color Coding**: White = available, Dark border = occupied, Gold border + cream bg = VIP, Dotted border = reserved, Red border + pink bg = needs bussing
**Nav Items**: Floor Plan, Waitlist (with count badge), Courts, Events, Insights & Analytics

### Branch 3: `waitlist`
**What it does**: Complete waitlist queue management with decline flow, smart table matching, and analytics

| Component | Purpose |
|-----------|---------|
| `WaitlistModule.jsx` | 60/40 split layout. Left: queue list with drag-reorder (dnd-kit). Right: stats + smart matcher. |
| `QueueHeader.jsx` | Title, live badge, Add Walk-In button, sort controls (Priority/Wait/Size), Declined Log link |
| `WaitlistCard.jsx` | Draggable card with: queue position, guest name, VIP crown, party size icons (lucide-react), source badge (Walk-In/Phone/Website/Host Stand), live wait timer with urgency colors (calm/attention/urgent), notes preview, action buttons (Seat Now/Notify/Decline) |
| `QueueStats.jsx` | 3-stat grid: In Queue, Avg Wait, Longest Wait |
| `SmartMatcher.jsx` | When guest selected: shows matching tables with section, pax fit, reason chips (e.g. "Exact party fit", "Preferred section"), Best Match badge. Assign Table button. |
| `DeclineDrawer.jsx` | Slide-in drawer: reason chips (Full capacity, Long wait, Large party, VIP priority, Closing soon, Custom), custom text input, Confirm Decline button |
| `DeclinedLogPanel.jsx` | Slide-in panel: list of declined guests with timestamp, reason pills, party info |
| `DeclineAnalyticsWidget.jsx` | Shows decline patterns when 3+ declines exist |
| `CapacityWarningBanner.jsx` | Amber pulsing banner when queue > 8 |
| `AddWalkInDrawer.jsx` | Form: guest name, party size stepper, source toggle, VIP switch, section preference, notes |
| `ToastStack.jsx` | Fixed top-right toast notifications with progress bar animation |

**Hooks**: `useWaitlistSimulator` (manages queue state, reorder, add/remove), `useDeclineFlow` (drawer state, flash/exit animations, declined log), `useSmartMatch` (table matching logic)
**Mock Data**: 8 waitlist entries with varied sources, VIP flags, section preferences
**Dependencies**: `@dnd-kit/core`, `@dnd-kit/sortable`, `date-fns`, `lucide-react`

---

## INTEGRATION ARCHITECTURE

### Single Unified App Structure

```
basquebackend/
├── backend/
│   ├── server.js              # Express + Socket.IO + MongoDB
│   ├── middleware/
│   │   └── auth.js            # Role-based authentication middleware
│   ├── models/
│   │   ├── User.js            # Staff accounts with roles
│   │   ├── MenuItem.js        # (exists) Menu items
│   │   ├── Order.js           # (exists) Kitchen orders
│   │   ├── ServiceRequest.js  # (exists) Waiter/bill calls
│   │   ├── Table.js           # NEW: Table state (replaces in-memory)
│   │   ├── WaitlistEntry.js   # NEW: Persisted waitlist
│   │   ├── Reservation.js     # NEW: Website lead pipeline
│   │   └── AuditLog.js        # NEW: All state changes
│   ├── routes/
│   │   ├── authRoutes.js      # Login/logout/session
│   │   ├── menuRoutes.js      # (exists)
│   │   ├── orderRoutes.js     # (exists) + enhance
│   │   ├── serviceRequestRoutes.js  # (exists)
│   │   ├── tableRoutes.js     # NEW: Table CRUD + status
│   │   ├── waitlistRoutes.js  # NEW: Queue management
│   │   └── reservationRoutes.js # NEW: Lead pipeline
│   └── seedData.js            # (exists) + extend with tables
├── src/
│   ├── App.jsx                # Unified router with auth guard
│   ├── context/
│   │   └── AuthContext.jsx    # Login state, role, permissions
│   ├── pages/
│   │   ├── LoginPage.jsx      # NEW: Role-based login screen
│   │   ├── MenuPage.jsx       # (exists) Guest PWA - NO AUTH
│   │   └── DashboardPage.jsx  # NEW: Unified dashboard shell
│   ├── components/
│   │   ├── Sidebar/           # Unified sidebar (from Floor-Management)
│   │   ├── TopBar/            # Stats bar (from Floor-Management)
│   │   ├── FloorPlan/         # Floor grid (from Floor-Management)
│   │   ├── KitchenDisplay/    # Order cards (from menu branch)
│   │   ├── WaitlistModule/    # (exists from waitlist branch)
│   │   ├── ServiceAlerts/     # Waiter/Bill requests panel
│   │   ├── ReservationPipeline/ # NEW: Website leads management
│   │   └── Insights/          # Analytics (merged from both)
│   ├── services/
│   │   ├── socket.js          # (exists)
│   │   └── api.js             # Unified API client
│   └── data/
│       └── menuData.js        # (exists)
└── public/
    └── icons/                 # PWA icons
```

### Route Map

| Route | Auth Required | Roles | Component |
|-------|--------------|-------|-----------|
| `/menu/:tableId` | NO | Guest | MenuPage (PWA) |
| `/login` | NO | - | LoginPage |
| `/dashboard` | YES | All staff | DashboardPage shell |
| `/dashboard/floor` | YES | Server, Floor Manager, Restaurant Manager, Owner | FloorPlan |
| `/dashboard/orders` | YES | Server, Floor Manager, Restaurant Manager, Owner | KitchenDisplay |
| `/dashboard/waitlist` | YES | Floor Manager, Restaurant Manager, Owner | WaitlistModule |
| `/dashboard/reservations` | YES | Restaurant Manager, Owner | ReservationPipeline |
| `/dashboard/service-alerts` | YES | Server, Floor Manager, Restaurant Manager, Owner | ServiceAlerts |
| `/dashboard/insights` | YES | Restaurant Manager, Owner | Insights |
| `/dashboard/settings` | YES | Owner | Settings |

---

## ROLE-BASED ACCESS CONTROL (RBAC)

### 5 Demo Login Accounts

```
┌──────────────────────┬─────────────┬──────────┐
│ Role                 │ PIN / Pass  │ Name     │
├──────────────────────┼─────────────┼──────────┤
│ Owner                │ owner@2024  │ Jalaj    │
│ Restaurant Manager   │ manager@24  │ Arjun    │
│ Floor Manager        │ 4455        │ Priya    │
│ Server               │ 1122        │ Rahul    │
│ Kitchen Display      │ 7788        │ Kitchen  │
└──────────────────────┴─────────────┴──────────┘
```

### Permission Matrix

| Feature | Owner | Rest. Manager | Floor Manager | Server | Kitchen |
|---------|-------|---------------|---------------|--------|---------|
| Floor Plan (view all tables) | ✅ | ✅ | ✅ | ✅ (own section) | ❌ |
| Change table status | ✅ | ✅ | ✅ | ✅ | ❌ |
| Seat / Clear table | ✅ | ✅ | ✅ | ✅ | ❌ |
| View active orders on table | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kitchen order management | ✅ | ✅ | ❌ | ❌ | ✅ |
| Mark order stages | ✅ | ✅ | ❌ | ✅ (Served only) | ✅ |
| Waitlist queue management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Accept/Decline reservations | ✅ | ✅ | ❌ | ❌ | ❌ |
| View reservation pipeline | ✅ | ✅ | ✅ (read-only) | ❌ | ❌ |
| Service alerts (waiter/bill) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Insights & Analytics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Menu item availability toggle | ✅ | ✅ | ❌ | ❌ | ✅ |
| Export audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## UNIFIED SIDEBAR NAVIGATION

The sidebar adapts based on logged-in role. Use the Floor-Management branch's sidebar design as the base.

```
BASQUE
MANAGER OS
─────────────────
⊞  Floor Plan          ← All staff (Servers see assigned section only)
🍳 Kitchen Orders      ← Owner, Manager, Kitchen
🔔 Service Alerts      ← All staff (badge with pending count)  
≡  Waitlist & Queue    ← Floor Manager+  (badge with queue count)
📋 Reservations        ← Manager+  (badge with new leads count)
△  Courts              ← Manager+  (Phase 2: coming soon)
◇  Events              ← Manager+  (Phase 2: coming soon)
⊙  Insights            ← Manager+
⚙  Settings            ← Owner only
─────────────────
Recent Activity
  12:34 PM - Table T5 seated
  12:31 PM - New order from T8
─────────────────
[Export Audit Log]      ← Manager+
[Logout]
```

---

## FEATURE-BY-FEATURE INTEGRATION SPEC

### 1. LOGIN PAGE (`/login`)

**Design**: Full-screen, centered card on warm cream background with grain overlay.

```
┌─────────────────────────────────┐
│                                 │
│         B A S Q U E             │  ← Cinzel, gold, letter-spaced
│        MANAGER  OS              │  ← Small caps, muted
│                                 │
│   ◇────────────◇────────────◇   │  ← Ornament divider (from waitlist)
│                                 │
│   ┌─────────────────────────┐   │
│   │  Select Your Role    ▼  │   │  ← Dropdown: Owner, Manager,
│   └─────────────────────────┘   │     Floor Manager, Server, Kitchen
│                                 │
│   ┌─────────────────────────┐   │
│   │  PIN / Password         │   │  ← PIN pad for Server/Floor/Kitchen
│   └─────────────────────────┘   │     Text input for Owner/Manager
│                                 │
│   ┌─────────────────────────┐   │
│   │      ENTER SERVICE  →   │   │  ← Gold button, Cinzel font
│   └─────────────────────────┘   │
│                                 │
│   Current Service: DINNER       │  ← Auto-detected from time
│   Wed, 28 May 2025              │
│                                 │
└─────────────────────────────────┘
```

**Implementation**:
- No JWT complexity. Use `localStorage` session with role + name + loginTime.
- `AuthContext` wraps entire app. `useAuth()` hook returns `{ user, role, login, logout, can(permission) }`.
- PIN entry: 4-digit numeric pad for Server/Floor Manager/Kitchen roles (quick login during service).
- Password entry: standard text field for Owner/Restaurant Manager.
- On successful login, redirect to `/dashboard` with role-appropriate default tab.
- Auto-logout after 8 hours of inactivity.

### 2. UNIFIED DASHBOARD SHELL (`/dashboard`)

**Layout**: Exact same layout as Floor-Management branch sidebar + main area.

```
┌──────────┬───────────────────────────────────────┐
│          │  Top Stats Bar (context-sensitive)     │
│ Sidebar  ├───────────────────────────────────────┤
│ (186px)  │                                       │
│          │  Active Tab Content                    │
│          │  (Floor / Orders / Waitlist / etc.)    │
│          │                                       │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

**Top Stats Bar** changes based on active tab:
- **Floor Plan**: Available | Seated | Needs Bussing | Avg Duration | Revenue | Waitlist Count
- **Kitchen Orders**: New | Preparing | Served | Total Revenue
- **Waitlist**: In Queue | Avg Wait | Longest Wait | Declined Today
- **Reservations**: New Leads | Confirmed | Declined | Today's Reservations
- **Service Alerts**: Pending Waiter Calls | Pending Bill Requests | Avg Response Time

### 3. FLOOR PLAN (Enhanced from `Floor-Management` branch)

**Base**: Use Floor-Management's `ManagerDashboard.jsx` floor grid as the foundation.

**Enhancements to add**:

#### A. Live Order Indicator on Table Cards
When a table has an active order (from the `menu` branch's order system), show it directly on the table card:

```
┌──────────────────┐
│ T8          5 Pax│
│ ★ Mehta Family   │  ← VIP gold star
│ 45m seated       │
│ Res: 19:30       │
│                  │
│ 🟢 3 items       │  ← NEW: Live order badge
│    ₹2,340        │     Green dot = preparing
│ 🔔 Waiter Called │  ← NEW: Service alert badge
└──────────────────┘
```

**Color coding for order status on card**:
- `🟡` Yellow dot = New order (just received)
- `🟢` Green dot = Preparing  
- `✅` Check = Served
- `🧾` Receipt = Bill requested
- `🔔` Bell = Waiter called

#### B. Click-to-Expand Table Detail Panel
When a table card is clicked, slide in a right-side detail panel (similar to waitlist's SmartMatcher panel):

```
┌─ Table T8 Detail ────────────────┐
│ MEHTA FAMILY          ★ VIP      │
│ 5 Pax · Terrace · Res 19:30     │
│ Seated: 45 minutes               │
│                                  │
│ ── Active Order ──────────────── │
│ Mango Burrata Bomb    ×2  ₹920  │
│ Butter Chicken        ×1  ₹795  │
│ Garden Bloom          ×2  ₹1350 │
│                    Total: ₹3,065 │
│ Status: 🟢 PREPARING            │
│                                  │
│ ── Service Requests ──────────── │
│ 🔔 Waiter Called  12:34 PM       │
│    [Acknowledge]  [Complete]     │
│                                  │
│ ── Quick Actions ─────────────── │
│ [Mark Served] [Request Bussing]  │
│ [Move to Waitlist] [Clear Table] │
│ [Add Note] [Flag VIP]           │
└──────────────────────────────────┘
```

#### C. Table Status Transition Flow
Enforce logical status flow with visual confirmation:

```
available → reserved → seated → needs_bussing → available
                ↓
         seated (walk-in)
```

When changing status, show a quick confirmation toast (use waitlist branch's ToastStack).

#### D. Section Summary Strip
Above the table grid, show a compact section summary:

```
Indoor: 3/7 occupied  |  Terrace: 1/4 occupied  |  Garden: 1/3 occupied  |  Bar: 0/4 occupied
```

### 4. KITCHEN DISPLAY SYSTEM (Enhanced from `menu` branch)

**Base**: Use menu branch's ManagerDashboard order cards.

**Enhancements**:

#### A. Column-Based KDS Layout (replace simple grid)
```
┌─── NEW ──────────┬─── PREPARING ─────┬─── READY ─────────┐
│                  │                   │                    │
│ ┌──────────────┐ │ ┌───────────────┐ │ ┌────────────────┐ │
│ │ T8 · 12:34   │ │ │ T1 · 12:28    │ │ │ T13 · 12:15    │ │
│ │ Mehta Family │ │ │ Hemant Dua    │ │ │ Walk-in        │ │
│ │──────────────│ │ │───────────────│ │ │────────────────│ │
│ │ Burrata ×2   │ │ │ Mushroom ×1   │ │ │ Biryani ×2     │ │
│ │ Butter Ch ×1 │ │ │ Caesar ×2     │ │ │ Dal Makhni ×1  │ │
│ │ Garden Bl ×2 │ │ │ Tikka ×1      │ │ │                │ │
│ │──────────────│ │ │───────────────│ │ │────────────────│ │
│ │ ₹3,065       │ │ │ ₹1,420        │ │ │ ₹2,175         │ │
│ │ [Start →]    │ │ │ [Ready →]     │ │ │ [Served ✓]     │ │
│ └──────────────┘ │ └───────────────┘ │ └────────────────┘ │
│                  │                   │                    │
└──────────────────┴───────────────────┴────────────────────┘
```

#### B. Order Timer
Each order card shows time since order was placed. Color-code:
- **< 10 min**: Normal (white)
- **10-20 min**: Amber warning
- **> 20 min**: Red urgent pulse (reuse waitlist's urgentPulse animation)

#### C. Sound + Visual Alert
When `order:new` socket event fires:
- Play a subtle chime sound
- Flash the "NEW" column header briefly
- Show toast: "New order from Table T8 — 5 items"

#### D. Auto-Link to Floor Plan
When an order's status changes to "served", automatically update the table card on Floor Plan to reflect it.

### 5. WAITLIST & QUEUE (Direct integration from `waitlist` branch)

**Base**: Import the entire `WaitlistModule/` directory as-is. This is the most complete module.

**Integration changes**:

#### A. Replace Mock Data with API
Replace `mockWaitlist.js` and `useWaitlistSimulator` with real API calls:
- `GET /api/waitlist` → fetch queue
- `POST /api/waitlist` → add walk-in
- `DELETE /api/waitlist/:id` → remove (on seat/decline)
- `PUT /api/waitlist/:id` → update status/priority
- Socket events: `waitlist:new`, `waitlist:updated`, `waitlist:removed`

#### B. Connect SmartMatcher to Real Table Data
SmartMatcher currently has no real table awareness. Wire it to:
- `GET /api/tables?status=available` → get available tables
- Match by: section preference, party size vs pax capacity, VIP priority
- When "Assign Table" is clicked → `PUT /api/tables/:id/status` to `seated` + remove from waitlist

#### C. Connect "Notify" to WhatsApp
When "Notify" is clicked:
- For now: show toast "WhatsApp notification sent to +91XXXXXX" (simulated)
- Phase 2: integrate WABA API for real delivery

#### D. Feed Website Leads into Waitlist
When a reservation from the website is confirmed for TODAY and the guest arrives:
- One-click "Add to Queue" from Reservation Pipeline → creates waitlist entry with source = "WEBSITE"

### 6. SERVICE ALERTS PANEL (Enhanced from `menu` branch)

**Base**: Menu branch's service requests tab.

**Enhancements**:

#### A. Priority Sorting
- Bill Requests first (revenue-blocking)
- Then Waiter Calls
- Within each type: oldest first

#### B. Prominent Visual Alert
When a new service request arrives:
- Sidebar badge number pulses
- If on another tab: amber notification bar slides down from top: "🔔 Table T8 is calling for waiter"
- Auto-switch to Service Alerts tab if role is Server

#### C. Quick Actions
```
┌─────────────────────────────────────────┐
│ 🔔 WAITER CALL                         │
│ Table T8 · Mehta Family · 12:34 PM     │
│ Time waiting: 2m 15s                    │
│                                         │
│ [Acknowledge]  [On My Way]  [Completed] │
└─────────────────────────────────────────┘
```

### 7. RESERVATION PIPELINE (NEW - connects to basque-web leads)

This is the bridge between the customer-facing website (`basque-web`) and the Manager OS.

#### A. Lead Sources
The website sends leads via `POST /api/leads` with these types:
- `table` — Table Reservation (from TableBookingModal)
- `event` — Event Enquiry (from EventEnquiryModal)
- `golf` — Golf Simulator (from GolfBookingModal)
- `golf_dining` — Golf & Dining Experience (from GolfDiningModal)

#### B. Pipeline View (Kanban)
```
┌─── NEW ──────────┬─── CONTACTED ─────┬─── CONFIRMED ─────┬─── DECLINED ──────┐
│                  │                   │                    │                   │
│ ┌──────────────┐ │                   │                    │                   │
│ │ TABLE        │ │                   │                    │                   │
│ │ Sharma       │ │                   │                    │                   │
│ │ +91 98xxx    │ │                   │                    │                   │
│ │ 4 Jun, 20:00 │ │                   │                    │                   │
│ │ 4 covers     │ │                   │                    │                   │
│ │ Anniversary  │ │                   │                    │                   │
│ │──────────────│ │                   │                    │                   │
│ │ [Call] [WA]  │ │                   │                    │                   │
│ │ [Confirm]    │ │                   │                    │                   │
│ │ [Decline]    │ │                   │                    │                   │
│ └──────────────┘ │                   │                    │                   │
└──────────────────┴───────────────────┴────────────────────┴───────────────────┘
```

#### C. Lead Card Design
Color-code by lead type:
- **Table**: Amber left stripe (primary service)
- **Event**: Teal left stripe (high value)
- **Golf**: Blue left stripe
- **Golf & Dining**: Blue-gold gradient stripe

#### D. Stage Transitions
```
new → contacted → confirmed → (day of) → checked_in
         ↓
      declined (with reason)
```

Each stage change:
- Logs to AuditLog
- Shows toast notification
- Updates stats counter in Top Bar

### 8. INSIGHTS & ANALYTICS (Merged from both branches)

**Combine** Floor-Management's revenue/duration metrics with menu branch's order analytics.

```
┌─────────────────────────────────────────────────────────┐
│ TODAY'S SERVICE                              DINNER      │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ Revenue     │ Covers      │ Avg Spend   │ Avg Turn Time │
│ ₹47,200     │ 34          │ ₹1,388      │ 62 min        │
├─────────────┴─────────────┴─────────────┴───────────────┤
│                                                         │
│ SERVICE RECOMMENDATIONS                                 │
│ ● 3 tables over average turn time — consider check-ins  │
│ ● 5 guests on waitlist — prioritize bussing             │
│ ● Mango Mania items are 40% of orders — ensure stock    │
│ ● 2 event leads uncontacted for 24+ hours               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ TOP ITEMS TODAY          │ SECTION PERFORMANCE           │
│ 1. Butter Chicken (12)   │ Indoor:  ₹15,400 / 12 covers │
│ 2. Margherita Pizza (9)  │ Terrace: ₹12,200 / 8 covers  │
│ 3. Garden Bloom (8)      │ Garden:  ₹11,600 / 9 covers  │
│ 4. Mango Burrata (7)     │ Bar:     ₹8,000 / 5 covers   │
│ 5. Chicken Biryani (6)   │                               │
└──────────────────────────┴───────────────────────────────┘
```

**Owner-only additions**:
- Waitlist decline analytics (from waitlist branch's DeclineAnalyticsWidget)
- Reservation conversion rate
- Day/Week/Month toggle
- Export full audit log as CSV

---

## DESIGN SYSTEM (Premium + Consistent)

### Color Palette (merge of both branches into one unified system)

```css
:root {
  /* Core Brand */
  --basque-cream:       #F5F0E8;     /* Page background */
  --basque-dark-brown:  #2C1A0E;     /* Sidebar bg */
  --basque-amber:       #C8852A;     /* Primary accent (gold) */
  --basque-amber-light: #E8A84A;     /* Hover state */
  --basque-white:       #FDFAF5;     /* Card backgrounds */

  /* Text */
  --basque-text-dark:   #1A1008;     /* Primary text */
  --basque-text-muted:  #8C7B6A;     /* Secondary text */
  --basque-border:      #E2D9CA;     /* Borders & dividers */

  /* Status Colors */
  --status-available:   #48B076;     /* Green - available / teal */
  --status-seated:      #2C2C2C;     /* Dark - occupied */
  --status-reserved:    #B0A99F;     /* Warm gray */
  --status-bussing:     #C04040;     /* Red - needs attention */
  --status-vip:         #C8852A;     /* Gold - VIP */
  --status-preparing:   #E8A84A;     /* Amber - in progress */
  --status-new:         #4A7AB5;     /* Blue - new item */

  /* Semantic */
  --success:  #48B076;
  --warning:  #E8A84A;
  --danger:   #C04040;
  --info:     #4A7AB5;

  /* Fonts */
  --font-display: 'Cormorant Garamond', Georgia, serif;  /* Headings, large numbers */
  --font-label:   'Cinzel', serif;                         /* Labels, buttons, nav */
  --font-body:    'Jost', 'DM Sans', sans-serif;          /* Body text, data */
}
```

### Typography Scale
- Page titles: `font-display`, 1.75rem, 600 weight
- Section headers: `font-label`, 0.85rem, letter-spacing 0.15em, uppercase
- Stats values: `font-display`, 2rem, 300 weight
- Body / data: `font-body`, 0.85-1rem, 300-400 weight
- Badges / tags: `font-label`, 0.7rem, letter-spacing 0.1em

### Component Library (reuse these across all tabs)

| Component | Source Branch | Usage |
|-----------|--------------|-------|
| Card with left stripe | waitlist | Waitlist cards, reservation cards, order cards |
| Status pill/badge | menu | Order status, reservation status |
| Chip toggle group | waitlist | Event type selection, source filters, sort controls |
| Stepper (±) | waitlist | Party size, covers |
| Slide-in Drawer | waitlist | Add Walk-In, Decline, Table Detail, Reservation Detail |
| Toast notifications | waitlist | All state changes across every tab |
| Stats grid | waitlist | Top bar stats, insights cards |
| Section filter tabs | Floor-Management | Floor Plan section filter |
| VIP badge (★) | Floor-Management | Table cards, waitlist cards |
| Ornament divider | waitlist | Section separators |
| Capacity warning banner | waitlist | Queue full, kitchen overload |

### Animations (Framer Motion)
- Page transitions: `opacity 0→1, y: 8→0, duration 0.3s`
- Cards: `hover: perspective(1000px) rotateX(1.5deg) translateY(-3px)`
- Drawer slide: `320ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Toast progress bar: `width 100%→0% over 5s linear`
- Decline flash: `box-shadow 0→6px→0 in 200ms`
- Urgent timer: `text-shadow pulse 3s infinite` (from waitlist)
- Grain overlay: SVG noise at 4% opacity (from waitlist)

---

## SOCKET.IO EVENT MAP (Unified)

All real-time events across the system:

```javascript
// Orders (existing from menu branch) 
'order:new'           → KDS new column, table card badge, stats update
'order:updated'       → KDS move card between columns, table card update
'order:deleted'       → KDS remove card, table card clear

// Service Requests (existing from menu branch)  
'service:new'         → Alert badge pulse, notification bar, auto-tab switch
'service:updated'     → Clear alert, update response time stats

// Tables (NEW)
'table:statusChanged' → Floor Plan card update, section summary update
'table:sessionStart'  → Card transitions to occupied, timer starts
'table:sessionEnd'    → Card transitions to needs_bussing

// Waitlist (NEW)
'waitlist:added'      → Queue card appears, stats update, badge increment
'waitlist:removed'    → Card exit animation, stats update
'waitlist:reordered'  → Queue re-renders with new order
'waitlist:notified'   → Card status changes to NOTIFIED (green stripe)

// Reservations (NEW)
'reservation:new'     → Pipeline card appears in NEW column, badge increment
'reservation:updated' → Card moves between columns
```

---

## BACKEND API ENDPOINTS (Complete)

### Auth
```
POST   /api/auth/login     { role, pin/password }  → { user, token }
POST   /api/auth/logout     
GET    /api/auth/session    → current user info
```

### Tables
```
GET    /api/tables                    → all tables with current status + active orders
GET    /api/tables?section=Indoor     → filtered by section
GET    /api/tables/:id                → single table detail + orders + service requests
PUT    /api/tables/:id/status         { status, guest?, isVip? }
GET    /api/tables/stats              → aggregated stats (available, seated, avg duration, etc.)
```

### Orders (enhance existing)
```
GET    /api/orders                    → all orders, sorted newest first
GET    /api/orders?status=new         → filtered
GET    /api/orders?tableId=T8         → orders for specific table
POST   /api/orders                    → create (from PWA menu)
PUT    /api/orders/:id/status         → update status
DELETE /api/orders/:id                → delete/cancel
```

### Waitlist (new)
```
GET    /api/waitlist                  → current queue, sorted by priority
POST   /api/waitlist                  → add walk-in or website arrival
PUT    /api/waitlist/:id              → update entry (status, priority, notes)
DELETE /api/waitlist/:id              → remove (seated or declined)
POST   /api/waitlist/:id/notify       → trigger WhatsApp notification
POST   /api/waitlist/:id/decline      → decline with reason + log
GET    /api/waitlist/declined          → declined log
```

### Reservations (new - receives from basque-web)
```
GET    /api/reservations                   → all, newest first
GET    /api/reservations?stage=new         → filtered by pipeline stage
POST   /api/reservations                   → create (webhook from basque-web /api/leads)
PUT    /api/reservations/:id/stage         { stage, note? }
GET    /api/reservations/stats             → pipeline counts
```

### Service Requests (existing)
```
GET    /api/service-requests
POST   /api/service-requests
PUT    /api/service-requests/:id/status
```

### Menu (existing)
```
GET    /api/menu
POST   /api/menu
PUT    /api/menu/:id
DELETE /api/menu/:id
PUT    /api/menu/:id/availability    { isAvailable: boolean }  ← NEW
```

### Insights
```
GET    /api/insights/today            → revenue, covers, avg spend, top items
GET    /api/insights/section-perf     → per-section breakdown
GET    /api/insights/waitlist-analytics → decline patterns
GET    /api/insights/reservation-funnel → conversion metrics
```

---

## MONGOOSE MODELS (New + Enhanced)

### User Model (NEW)
```javascript
{
  name: String,
  role: { type: String, enum: ['owner', 'restaurant_manager', 'floor_manager', 'server', 'kitchen'] },
  pin: String,        // Hashed, for quick-login roles
  password: String,   // Hashed, for owner/manager
  section: String,    // Optional: assigned section for servers
  isActive: Boolean,
  lastLogin: Date
}
```

### Table Model (NEW - replaces in-memory)
```javascript
{
  tableId: String,     // T1, T2, etc.
  section: String,     // Indoor, Terrace, Garden, Bar
  pax: Number,
  status: { type: String, enum: ['available', 'seated', 'reserved', 'needs_bussing'] },
  guest: String,
  isVip: Boolean,
  seatedAt: Date,
  reservation: String,
  notes: String
}
```

### WaitlistEntry Model (NEW)
```javascript
{
  guestName: String,
  partySize: Number,
  source: { type: String, enum: ['WALK_IN', 'PHONE', 'WEBSITE', 'HOST_STAND'] },
  phone: String,
  waitStart: Date,
  estimatedWait: Number,
  status: { type: String, enum: ['WAITING', 'NOTIFIED', 'SEATED', 'DECLINED'] },
  notes: String,
  priority: Number,
  isVip: Boolean,
  sectionPreference: String,
  declineReason: String,
  declinedAt: Date,
  declinedBy: { name: String, role: String }
}
```

### Reservation Model (NEW)
```javascript
{
  name: String,
  phone: String,
  service: { type: String, enum: ['table', 'event', 'golf', 'golf_dining'] },
  date: String,
  time: String,
  guests: Number,
  source: String,      // e.g., 'table_booking_modal', 'event_enquiry_modal'
  stage: { type: String, enum: ['new', 'contacted', 'confirmed', 'declined', 'checked_in'], default: 'new' },
  stageNote: String,
  details: Object,     // Flexible: occasion, space preference, budget, package, etc.
  timestamp: Date
}
```

### AuditLog Model (NEW)
```javascript
{
  action: String,      // 'table_status_change', 'order_created', 'reservation_confirmed', etc.
  entity: String,      // 'table', 'order', 'waitlist', 'reservation'
  entityId: String,
  performer: { name: String, role: String },
  details: Object,     // Before/after state
  timestamp: Date
}
```

---

## IMPLEMENTATION ORDER

### Phase 1: Foundation (Do This First)
1. Create `backend/models/User.js` and `backend/routes/authRoutes.js`
2. Seed 5 demo accounts
3. Create `src/context/AuthContext.jsx` and `src/pages/LoginPage.jsx`
4. Create `src/pages/DashboardPage.jsx` as the shell with unified Sidebar + TopBar
5. Wire up routing: `/login`, `/dashboard`, `/menu/:tableId`

### Phase 2: Floor Plan + Tables
1. Create `backend/models/Table.js` and `backend/routes/tableRoutes.js`
2. Seed 18 tables (from Floor-Management's server.js data)
3. Port Floor-Management's floor grid into `src/components/FloorPlan/`
4. Add Socket.IO events for table status changes
5. Add table detail click-to-expand panel

### Phase 3: Kitchen Display
1. Enhance `src/components/KitchenDisplay/` from menu branch's order cards
2. Convert to 3-column KDS layout (New → Preparing → Ready)
3. Add order timer + color coding
4. Connect socket events to floor plan table badges

### Phase 4: Waitlist Integration
1. Create `backend/models/WaitlistEntry.js` and `backend/routes/waitlistRoutes.js`
2. Copy `WaitlistModule/` from waitlist branch into `src/components/`
3. Replace mock data hooks with real API + Socket.IO
4. Wire SmartMatcher to real available tables from `/api/tables`

### Phase 5: Reservations + Service Alerts
1. Create `backend/models/Reservation.js` and `backend/routes/reservationRoutes.js`
2. Build Kanban pipeline UI in `src/components/ReservationPipeline/`
3. Enhance Service Alerts with priority sorting and acknowledgement flow
4. Connect basque-web's `/api/leads` to create reservations

### Phase 6: Insights + Polish
1. Build unified Insights page merging both branch analytics
2. Add CSV export for audit logs
3. Add sound notifications for new orders
4. Responsive testing (tablet-first for iPad behind bar)
5. PWA manifest + service worker for kitchen display offline resilience

---

## CRITICAL INTEGRATION RULES

1. **DO NOT rewrite** working code. Copy Floor-Management's CSS and component logic directly. Copy waitlist's entire module. Adapt, don't rebuild.

2. **One shared Socket.IO connection**. All tabs subscribe to the same socket instance (`src/services/socket.js`). Each tab listens for its relevant events.

3. **Consistent toast system**. Use the waitlist branch's `ToastStack` component everywhere. Every state change = toast notification.

4. **Table ID is the universal key**. Orders reference `tableId`, service requests reference `tableId`, floor plan uses `tableId`. Everything connects through the table.

5. **MongoDB Atlas** stays as the database (already configured in menu branch). No migration to PostgreSQL for this phase (the PostgreSQL schema spec is for a future enterprise build).

6. **Menu page (`/menu/:tableId`) stays auth-free**. Guests scan QR → see menu → place orders. No login required. Everything else requires login.

7. **Mobile-first for menu, tablet-first for dashboard**. The PWA menu is phone-optimized. The Manager OS is designed for iPad/tablet behind the host stand or bar. Desktop also supported.

8. **Grain overlay + Cormorant Garamond + Cinzel** are non-negotiable design elements. They define the Basque brand. Every screen must have the grain texture and use the type system.

---

## FILE-BY-FILE MERGE MAP

| Target File | Source | Action |
|-------------|--------|--------|
| `src/App.jsx` | menu branch | Rewrite with AuthContext, login route, dashboard route |
| `src/pages/LoginPage.jsx` | NEW | Create from spec above |
| `src/pages/DashboardPage.jsx` | NEW | Shell with Sidebar + TopBar + tab router |
| `src/pages/MenuPage.jsx` | menu branch | Keep as-is (guest PWA) |
| `src/components/Sidebar/` | Floor-Management | Port sidebar, add role-based nav filtering |
| `src/components/TopBar/` | Floor-Management | Port stats bar, make context-sensitive |
| `src/components/FloorPlan/` | Floor-Management | Port floor grid + cards, add order badges |
| `src/components/KitchenDisplay/` | menu branch | Refactor from ManagerDashboard orders tab |
| `src/components/WaitlistModule/` | waitlist branch | Copy entire directory, swap mock → API |
| `src/components/ServiceAlerts/` | menu branch | Extract from ManagerDashboard, enhance |
| `src/components/ReservationPipeline/` | NEW | Build Kanban from spec |
| `src/components/Insights/` | Both | Merge analytics from both branches |
| `src/context/AuthContext.jsx` | NEW | Role + session management |
| `src/services/socket.js` | menu branch | Keep, add new event listeners |
| `src/services/api.js` | NEW | Unified API client replacing multiple files |
| `backend/models/User.js` | NEW | Staff authentication model |
| `backend/models/Table.js` | NEW | Persistent table state |
| `backend/models/WaitlistEntry.js` | NEW | Persistent waitlist |
| `backend/models/Reservation.js` | NEW | Website lead pipeline |
| `backend/models/AuditLog.js` | NEW | Compliance logging |
| `backend/middleware/auth.js` | NEW | Role-based route protection |
| `backend/routes/authRoutes.js` | NEW | Login/logout |
| `backend/routes/tableRoutes.js` | NEW | Table CRUD + status |
| `backend/routes/waitlistRoutes.js` | NEW | Queue management |
| `backend/routes/reservationRoutes.js` | NEW | Lead pipeline |
| `backend/server.js` | menu branch | Enhance with new routes + socket events |

---

## TESTING CHECKLIST

After integration, verify these flows work end-to-end:

- [ ] Guest scans QR for Table T8 → sees menu → adds items → sends order
- [ ] Order appears in Kitchen Display (NEW column) via Socket.IO within 1 second
- [ ] Table T8 on Floor Plan shows "🟡 3 items, ₹3,065" badge
- [ ] Kitchen marks order as "Preparing" → T8 badge updates to 🟢
- [ ] Guest taps "Call Waiter" → Service Alert appears for Server role
- [ ] Server acknowledges waiter call → bell icon clears on T8 card
- [ ] Walk-in arrives → Floor Manager adds to Waitlist via drawer
- [ ] SmartMatcher suggests T2 (Indoor, 3 Pax, available) → Floor Manager assigns
- [ ] T2 transitions to "seated" on Floor Plan, waitlist entry removed
- [ ] Website visitor submits table reservation on basque-web
- [ ] Reservation appears in Pipeline → Manager contacts → confirms
- [ ] On reservation day, guest arrives → Manager moves from Pipeline to Waitlist
- [ ] Owner logs in → sees all tabs including Insights and Settings
- [ ] Server logs in → sees only Floor Plan, Orders (own section), Service Alerts
- [ ] Kitchen logs in → sees only Kitchen Display + menu availability toggle
- [ ] All state changes log to AuditLog → exportable as CSV

---

*This prompt contains everything needed to build the unified Basque Manager OS. No additional context is required. Start with Phase 1 (auth + shell) and work through each phase sequentially.*
