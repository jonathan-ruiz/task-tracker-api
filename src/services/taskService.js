const repo = require('../repositories/taskRepository');
const { parsePagination, buildMeta } = require('../utils/pagination');

function createTask(data) {
  return repo.createTask(data);
}

function listTasks(query) {
  const { page, perPage, limit, offset } = parsePagination(query);
  const filters = {
    status: query.status,
    search: query.search,
    due_before: query.due_before,
    due_after: query.due_after,
    sort_by: query.sort_by || 'created_at',
    sort_order: query.sort_order || 'desc',
  };

  const tasks = repo.listTasks({ limit, offset, ...filters });
  const total = repo.countTasks(filters);
  const meta = buildMeta(page, perPage, total);

  return { tasks, meta };
}

function getTaskById(id) {
  return repo.getTaskById(id);
}

function updateTask(id, fields) {
  return repo.updateTask(id, fields);
}

function deleteTask(id) {
  return repo.deleteTask(id);
}

module.exports = { createTask, listTasks, getTaskById, updateTask, deleteTask };
