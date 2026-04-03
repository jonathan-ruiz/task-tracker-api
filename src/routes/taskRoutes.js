const { Router } = require('express');
const controller = require('../controllers/taskController');
const { validate } = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema, listTasksSchema } = require('../validators/taskSchemas');

const router = Router();

router.get('/', validate(listTasksSchema, 'query'), controller.listTasks);
router.post('/', validate(createTaskSchema), controller.createTask);
router.get('/:id', controller.getTask);
router.patch('/:id', validate(updateTaskSchema), controller.updateTask);
router.delete('/:id', controller.deleteTask);

module.exports = router;
