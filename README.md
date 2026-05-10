# ⚔️ Tickd

> Level up your life, one habit at a time. A gamified habit tracker with XP, levels, streaks, friends, and weekly email reports.

tickd.oscarh.co.uk

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

Emails fire every Monday at 8am server time.

## Project Structure

```
habitloop/
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
