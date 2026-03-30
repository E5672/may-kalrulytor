const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('finance.db');

// ── Создаём таблицы при первом запуске ──────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS operations (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    type     TEXT    NOT NULL,
    sector   TEXT    NOT NULL,
    category TEXT    NOT NULL,
    amount   REAL    NOT NULL,
    date     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plans (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    type     TEXT NOT NULL,
    category TEXT NOT NULL,
    amount   REAL NOT NULL,
    UNIQUE(type, category)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── OPERATIONS ───────────────────────────────────────────────────

// Получить все операции (новые сверху)
app.get('/api/operations', (req, res) => {
  const rows = db.prepare('SELECT * FROM operations ORDER BY id DESC').all();
  res.json(rows);
});

// Добавить операцию
app.post('/api/operations', (req, res) => {
  const { type, sector, category, amount } = req.body;

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Неверный тип' });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Неверная сумма' });
  }

  const result = db
    .prepare('INSERT INTO operations (type, sector, category, amount) VALUES (?, ?, ?, ?)')
    .run(type, sector || '', category || '', Number(amount));

  res.json({ id: result.lastInsertRowid });
});

// Удалить операцию
app.delete('/api/operations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Неверный id' });

  db.prepare('DELETE FROM operations WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ── PLANS ────────────────────────────────────────────────────────

// Получить все планы + общий бюджет
app.get('/api/plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM plans').all();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'budget_total'").get();
  res.json({ plans, total: row ? Number(row.value) : 0 });
});

// Сохранить общий бюджет
app.post('/api/plans/total', (req, res) => {
  const amount = Number(req.body.amount);
  if (isNaN(amount)) return res.status(400).json({ error: 'Неверная сумма' });

  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('budget_total', ?)
    ON CONFLICT(key) DO UPDATE SET value = ?
  `).run(String(amount), String(amount));

  res.json({ ok: true });
});

// Добавить / обновить план по категории
app.post('/api/plans/category', (req, res) => {
  const { type, category, amount } = req.body;
  if (!category) return res.status(400).json({ error: 'Нет категории' });

  const num = Number(amount);
  if (isNaN(num) || num <= 0) return res.status(400).json({ error: 'Неверная сумма' });

  db.prepare(`
    INSERT INTO plans (type, category, amount) VALUES (?, ?, ?)
    ON CONFLICT(type, category) DO UPDATE SET amount = ?
  `).run(type || 'expense', category, num, num);

  res.json({ ok: true });
});

// Удалить план категории
app.delete('/api/plans/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Неверный id' });

  db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ── Запуск сервера ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
