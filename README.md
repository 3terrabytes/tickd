# ⚔️ HabitQuest

> Level up your life, one habit at a time. A gamified habit tracker with XP, levels, streaks, friends, and weekly email reports.

## Features

- **🔐 Auth** — Sign up / log in with JWT, persistent sessions
- **✅ Habit Tracking** — Add habits with custom icons & colors, check off daily
- **⚡ XP & Levels** — Earn XP for every completion; streaks give bonus XP
- **🔥 Streaks** — Daily streaks tracked automatically, broken if you skip a day
- **🏆 Leaderboard** — See your friends ranked by XP
- **👥 Friends** — Search players, send/accept requests, view their progress
- **📧 Weekly Emails** — Cron job sends Monday morning summaries (optional)

## XP System

| Streak Length | XP per completion |
|--------------|-------------------|
| 0–2 days     | 10 XP             |
| 3–6 days     | 15 XP (+5 bonus)  |
| 7–13 days    | 20 XP (+10 bonus) |
| 14–29 days   | 25 XP (+15 bonus) |
| 30+ days     | 35 XP (+25 bonus) |

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
3. Add env var: `REACT_APP_API_URL` = your backend URL (e.g. `https://habitquest-api.onrender.com`)
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
habitquest/
├── backend/
│   └── src/
│       ├── db/index.js          # DB connection + schema init
│       ├── middleware/auth.js   # JWT middleware
│       ├── routes/
│       │   ├── auth.js          # Register, login, /me
│       │   ├── habits.js        # CRUD + complete/uncomplete
│       │   └── friends.js       # Search, request, accept, leaderboard
│       ├── utils/xp.js          # XP & level math
│       └── index.js             # Server + cron job
├── frontend/
│   └── src/
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── AuthPage.jsx
│       │   ├── Dashboard.jsx
│       │   └── FriendsPage.jsx
│       ├── utils/xp.js
│       ├── api.js
│       └── App.jsx
└── render.yaml
```
