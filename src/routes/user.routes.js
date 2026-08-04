// ============================================================
// user.routes.js — Rutas del módulo de administración de usuarios
// ============================================================
// ORIGEN: montado en src/index.js como app.use('/api/users', userRoutes)
// DESTINO: todas las rutas delegan en user.controller.js → UserModel (MySQL)
//
// Endpoints disponibles:
//   POST   /api/users              → Crear usuario
//   GET    /api/users              → Listar todos los usuarios
//   GET    /api/users/:userId/tasks → Tareas asignadas a un usuario
//   GET    /api/users/:id           → Obtener un usuario por ID
//   PUT    /api/users/:id           → Actualizar un usuario
//   DELETE /api/users/:id           → Eliminar un usuario
//   PATCH  /api/users/:id/status   → Activar/desactivar un usuario
// ============================================================

// Crea el Router de Express
const router = require('express').Router();
// Importa el controlador de usuarios (lógica de negocio)
// Viene de: controllers/user.controller.js
const userController = require('../controllers/user.controller');

// POST /api/users → userController.create
// FLUJO: frontend (usersService) → create → valida campos → UserModel.create → INSERT
router.post('/',          userController.create);

// GET /api/users → userController.getAll
// FLUJO: frontend (usersService.loadUsers / tareasService.searchUser) → UserModel.findAll
router.get('/',           userController.getAll);

// IMPORTANTE: /:userId/tasks DEBE ir antes de /:id para que Express
// no interprete "tasks" como un ID de usuario.
// GET /api/users/:userId/tasks → userController.getUserTasks
// FLUJO: tareasService.searchUser → fetchTasksByUser → UserModel + TaskModel.findByUserId (JOIN)
router.get('/:userId/tasks', userController.getUserTasks);

// GET /api/users/:id → userController.getById → UserModel.findById (SELECT por id)
router.get('/:id',        userController.getById);

// PUT /api/users/:id → userController.update → UserModel.update (UPDATE parcial)
router.put('/:id',        userController.update);

// DELETE /api/users/:id → userController.remove → UserModel.delete (DELETE + cascade)
router.delete('/:id',     userController.remove);

// PATCH /api/users/:id/status → userController.toggleStatus → UserModel.updateActive
router.patch('/:id/status', userController.toggleStatus);

// EXPORTA el router: lo consume src/index.js
module.exports = router;
