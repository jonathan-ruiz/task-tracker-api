// In-memory task store
let tasks = [];
let nextId = 1;

const db = {
  findAll() {
    return [...tasks];
  },

  findById(id) {
    return tasks.find(t => t.id === id) || null;
  },

  create({ title, description = '', status = 'pending' }) {
    const task = {
      id: nextId++,
      title,
      description,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    return task;
  },

  update(id, fields) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...fields, updatedAt: new Date().toISOString() };
    return tasks[idx];
  },

  delete(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  },

  // Test helper — reset state between tests
  _reset() {
    tasks = [];
    nextId = 1;
  },
};

module.exports = db;
