# ⚔️ Tickd

> Level up your life, one habit at a time. A gamified habit tracker with XP, levels, streaks, a pixel avatar, an item shop, friends, gifting, and more.

## Features

- **🔐 Auth** — Sign up / log in with JWT, persistent sessions
- **✅ Habit Tracking** — Add habits with custom icons & colors, check off daily
- **⚡ XP & Levels** — Earn XP for every completion; streaks multiply your rewards
- **🪙 Gold** — Earn gold alongside XP; spend it in the shop
- **🔥 Streaks** — Daily streaks tracked automatically, broken if you skip a day
- **🧙 Pixel Avatar** — Customise skin, hair, eyes, style, and gender; equip gear from the shop
- **🛒 Item Shop** — Buy weapons, armour, banners, and badges with gold
- **🎁 Gifting & Trading** — Send items to friends or propose item-for-item trades
- **👥 Friends** — Search players, send/accept requests, view public profiles
- **🏆 Leaderboard** — See your friends ranked by XP
- **🔒 Privacy Controls** — Per-field visibility: XP, streaks, and habits can each be set to Everyone / Friends Only / Private
- **🎨 Themes** — Seven colour themes (Default, Midnight, Forest, Rose, Ocean, Sunset, Mono)
- **🔔 Push Notifications** — Optional daily reminder via service worker at a time you choose
- **💡 Suggestions** — Submit and upvote feature ideas in-app
- **📧 Weekly Emails** — Cron job sends Monday morning habit summaries (optional)

## XP & Gold System

| Streak Length | XP per completion | Gold per completion |
|--------------|-------------------|---------------------|
| 0–2 days     | 10 XP             | 10 gold             |
| 3–6 days     | 15 XP (+5 bonus)  | 15 gold             |
| 7–13 days    | 20 XP (+10 bonus) | 20 gold             |
| 14–29 days   | 25 XP (+15 bonus) | 25 gold             |
| 30+ days     | 35 XP (+25 bonus) | 35 gold             |

Levels scale quadratically: XP needed = `100 × level^1.5`

## Stack

- **Backend:** Node.js + Express, PostgreSQL (`pg`), JWT auth, bcrypt, node-cron, nodemailer
- **Frontend:** React 18, React Router 6, vanilla CSS
- **Deploy:** Render (backend web service + static site + managed Postgres)

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:3001
npm install
npm start
```

## Deploy to Render

### Option A: render.yaml (recommended)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your repo — Render reads `render.yaml` and provisions everything automatically

### Option B: Manual

**Database:**
1. New → PostgreSQL → Free tier → Create
2. Copy the Internal Database URL

**Backend:**
1. New → Web Service → Connect repo → Root dir: `backend`
2. Build: `npm install` | Start: `npm start`
3. Add env vars:
   - `DATABASE_URL` = your Postgres connection string
   - `JWT_SECRET` = any long random string
   - `NODE_ENV` = `production`

**Frontend:**
1. New → Static Site → Connect repo → Root dir: `frontend`
2. Build: `npm install && npm run build` | Publish: `build`
3. Add env var: `REACT_APP_API_URL` = your backend URL (e.g. `https://tickd-api.onrender.com`)
4. Add rewrite rule: `/*` → `/index.html`

## Optional: Weekly Emails

Set these env vars on the backend service:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-gmail-app-password   # Create at myaccount.google.com/apppasswords
APP_URL=your-frontend.onrender.com
```

Emails fire every Monday at 8am server time.

## Project Structure

```
tickd/
├── backend/
│   └── src/
│       ├── db/index.js            # DB connection + schema init
│       ├── middleware/auth.js     # JWT middleware
│       ├── routes/
│       │   ├── auth.js            # Register, login, /me
│       │   ├── habits.js          # CRUD + complete/uncomplete
│       │   ├── friends.js         # Search, request, accept, leaderboard
│       │   ├── shop.js            # Avatar shop + inventory + equip
│       │   ├── gifts.js           # Send, receive, trade items
│       │   ├── profile.js         # Public profile lookup
│       │   ├── settings.js        # Privacy, theme, notifications
│       │   └── suggestions.js     # Community feature requests + votes
│       ├── data/items.js          # Shop item definitions
│       ├── utils/xp.js            # XP & level math
│       └── index.js               # Server entry + cron job
├── frontend/
│   └── src/
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── PixelCharacter.jsx  # SVG avatar renderer
│       │   └── UpdateModal.jsx     # Changelog modal
│       ├── pages/
│       │   ├── AuthPage.jsx
│       │   ├── Dashboard.jsx
│       │   ├── AvatarPage.jsx
│       │   ├── FriendsPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── SettingsPage.jsx
│       │   └── SuggestionsPage.jsx
│       ├── utils/
│       │   ├── themes.js           # Theme definitions + applyTheme()
│       │   └── xp.js
│       ├── api.js
│       └── App.jsx
├── render.yaml
└── package.json
```
