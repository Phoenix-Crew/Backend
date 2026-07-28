// ============================================================
// task.routes.js — Rutas CRUD para el modulo de tareas
// ============================================================

const router = require('express').Router();
const taskController = require('../controllers/task.controller');

router.post('/',                    taskController.create);         // POST   /api/tasks
router.get('/',                     taskController.getAll);         // GET    /api/tasks
router.get('/filter',               taskController.filter);         // GET    /api/tasks/filter?status=&userId=&dateFrom=&dateTo=
router.get('/:id',                  taskController.getById);        // GET    /api/tasks/:id
router.put('/:id',                  taskController.update);         // PUT    /api/tasks/:id
router.patch('/:id/status',         taskController.updateStatus);   // PATCH  /api/tasks/:id/status
router.patch('/:id',                taskController.update);         // PATCH  /api/tasks/:id
router.delete('/:id',               taskController.remove);         // DELETE /api/tasks/:id
router.post('/:taskId/assign',      taskController.assignUsers);    // POST   /api/tasks/:taskId/assign
router.get('/:taskId/users',        taskController.getAssignedUsers);       // GET    /api/tasks/:taskId/users
router.delete('/:taskId/users/:userId', taskController.removeUserAssignment); // DELETE /api/tasks/:taskId/users/:userId

module.exports = router;
