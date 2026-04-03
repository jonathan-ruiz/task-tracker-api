const service = require('../services/taskService');

function createTask(req, res, next) {
  try {
    const task = service.createTask(req.validatedBody);
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
}

function listTasks(req, res, next) {
  try {
    const { tasks, meta } = service.listTasks(req.validatedQuery);
    res.json({ data: tasks, meta });
  } catch (err) {
    next(err);
  }
}

function getTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' } });
    }
    const task = service.getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
    }
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

function updateTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' } });
    }
    const task = service.updateTask(id, req.validatedBody);
    if (!task) {
      return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
    }
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

function deleteTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' } });
    }
    const deleted = service.deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
