require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { initDB, pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/avatar', require('./routes/shop'));
app.use('/api/gifts', require('./routes/gifts'));
app.use('/api/suggestions', require('./routes/suggestions'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Weekly summary emails — every Monday at 8am
cron.schedule('0 8 * * 1', async () => {
  if (!process.env.SMTP_HOST) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const { rows: users } = await pool.query('SELECT id, email, username, level, xp FROM users');

  for (const user of users) {
    const { rows: habits } = await pool.query(`
      SELECT h.name, h.streak, h.icon,
        COUNT(l.id) FILTER (
          WHERE l.completed_date >= NOW() - INTERVAL '7 days'
        ) AS completions_this_week
      FROM habits h
      LEFT JOIN habit_logs l ON l.habit_id = h.id
      WHERE h.user_id = $1
      GROUP BY h.id
    `, [user.id]);

    if (!habits.length) continue;

    const habitLines = habits.map(h =>
      `${h.icon} ${h.name}: ${h.completions_this_week}/7 days · 🔥 ${h.streak} day streak`
    ).join('\n');

    const totalCompletions = habits.reduce((s, h) => s + Number(h.completions_this_week), 0);
    const totalPossible = habits.length * 7;
    const pct = Math.round((totalCompletions / totalPossible) * 100);

    await transporter.sendMail({
      from: `Tickd <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `⚔️ Your weekly Tickd report — Level ${user.level}`,
      text: `Hey ${user.username}!\n\nYour week: ${pct}% completion rate\n\n${habitLines}\n\nKeep it up — your streak depends on it! 🏆\n\nhttps://${process.env.APP_URL}`
    });
  }

  console.log('✅ Weekly emails sent');
});

const PORT = process.env.PORT || 3001;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Tickd backend on :${PORT}`));
});
