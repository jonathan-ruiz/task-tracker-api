const { getDb } = require('../db/client');

const SORTABLE_FIELDS = new Set(['created_at', 'updated_at', 'due_date', 'title']);

function createTask({ title, description, status, due_date }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, status, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  `);
  const result = stmt.run(title, description || null, status || 'todo', due_date || null);
  return getTaskById(result.lastInsertRowid);
}

function listTasks({ limit, offset, status, search, due_before, due_after, sort_by = 'created_at', sort_order = 'desc' }) {
  const db = getDb();
  const safeSortBy = SORTABLE_FIELDS.has(sort_by) ? sort_by : 'created_at';
  const safeSortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (due_before) {
    conditions.push('due_date <= ?');
    params.push(due_before);
  }
  if (due_after) {
    conditions.push('due_date >= ?');
    params.push(due_after);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM tasks ${where} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
  return db.prepare(sql).all(...params, limit, offset);
}

function countTasks({ status, search, due_before, due_after }) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (due_before) {
    conditions.push('due_date <= ?');
    params.push(due_before);
  }
  if (due_after) {
    conditions.push('due_date >= ?');
    params.push(due_after);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const row = db.prepare(`SELECT COUNT(*) as count FROM tasks ${where}`).get(...params);
  return row.count;
}

function getTaskById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) || null;
}

function updateTask(id, fields) {
  const db = getDb();
  const allowed = ['title', 'description', 'status', 'due_date'];
  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return getTaskById(id);

  const setClauses = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([, v]) => v);
  const sql = `UPDATE tasks SET ${setClauses}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`;
  const result = db.prepare(sql).run(...values, id);
  if (result.changes === 0) return null;
  return getTaskById(id);
}

function deleteTask(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = { createTask, listTasks, countTasks, getTaskById, updateTask, deleteTask };
