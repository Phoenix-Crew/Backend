// ============================================================
// task.routes.js — Rutas CRUD para el modulo de tareas
// ============================================================
// ORIGEN: montado en src/index.js como app.use('/api/tasks', taskRoutes)
// DESTINO: todas las rutas delegan en task.controller.js → TaskModel (MySQL)
// ============================================================

// Crea el Router de Express
const router = require('express').Router();
// Importa el controlador de tareas (lógica de negocio)
// Viene de: controllers/task.controller.js
const taskController = require('../controllers/task.controller');

// Cada línea = una ruta → función del controlador:
// FLUJO GENERAL: fetch del frontend (tareasApi.js) → Express → taskController.*
// → TaskModel.* → SQL sobre tasks / task_users → JSON

router.post('/',                    taskController.create);         // POST   /api/tasks        → INSERT tarea + asignaciones (transacción)
router.get('/',                     taskController.getAll);         // GET    /api/tasks        → SELECT todas + JOIN task_users
router.get('/filter',               taskController.filter);         // GET    /api/tasks/filter?status=&userId=&dateFrom=&dateTo= → filtro combinado
router.get('/:id',                  taskController.getById);        // GET    /api/tasks/:id    → SELECT una tarea con sus asignados
router.put('/:id',                  taskController.update);         // PUT    /api/tasks/:id    → UPDATE completo
router.patch('/:id/status',         taskController.updateStatus);   // PATCH  /api/tasks/:id/status → UPDATE solo del estado
router.patch('/:id',                taskController.update);         // PATCH  /api/tasks/:id    → UPDATE parcial
router.delete('/:id',               taskController.remove);         // DELETE /api/tasks/:id    → DELETE (cascade quita task_users)
router.post('/:taskId/assign',      taskController.assignUsers);    // POST   /api/tasks/:taskId/assign → asigna un usuario existente
router.get('/:taskId/users',        taskController.getAssignedUsers);       // GET    /api/tasks/:taskId/users → usuarios asignados
router.delete('/:taskId/users/:userId', taskController.removeUserAssignment); // DELETE /api/tasks/:taskId/users/:userId → quita asignación

// EXPORTA el router: lo consume src/index.js
module.exports = router;
