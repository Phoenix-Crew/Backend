// ============================================================
// user.routes.js — Rutas del módulo de administración de usuarios
// ============================================================
// Endpoints disponibles:
//   POST   /api/users              → Crear usuario
//   GET    /api/users              → Listar todos los usuarios
//   GET    /api/users/:userId/tasks → Tareas asignadas a un usuario
//   GET    /api/users/:id           → Obtener un usuario por ID
//   PUT    /api/users/:id           → Actualizar un usuario
//   DELETE /api/users/:id           → Eliminar un usuario
//   PATCH  /api/users/:id/status   → Activar/desactivar un usuario

const router = require('express').Router();
const userController = require('../controllers/user.controller');

router.post('/',          userController.create);
router.get('/',           userController.getAll);

// IMPORTANTE: /:userId/tasks DEBE ir antes de /:id para que Express
// no interprete "tasks" como un ID de usuario.
router.get('/:userId/tasks', userController.getUserTasks);

router.get('/:id',        userController.getById);
router.put('/:id',        userController.update);
router.delete('/:id',     userController.remove);
router.patch('/:id/status', userController.toggleStatus);

module.exports = router;