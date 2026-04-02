const { Router } = require('express');
const db = require('./db');

const router = Router();

const VALID_STATUSES = ['pending', 'in-progress', 'done'];

// GET /tasks — list all tasks (optional ?status= filter)
router.get('/', (req, res) => {
  let tasks = db.findAll();
  const { status } = req.query;
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    tasks = tasks.filter(t => t.status === status);
  }
  res.json(tasks);
});

// GET /tasks/:id — get one task
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task ID' });
  const task = db.findById(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /tasks — create task
router.post('/', (req, res) => {
  const { title, description, status } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const task = db.create({ title: title.trim(), description, status });
  res.status(201).json(task);
});

// PATCH /tasks/:id — update task
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task ID' });

  const { title, description, status } = req.body;
  const updates = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    updates.title = title.trim();
  }
  if (description !== undefined) updates.description = description;
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    updates.status = status;
  }

  const task = db.update(id, updates);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// DELETE /tasks/:id — delete task
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task ID' });
  const deleted = db.delete(id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

module.exports = router;
