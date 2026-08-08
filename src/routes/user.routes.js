// Cómo se lee: "Const router se asigna a require punto express punto Router."
const router = require('express').Router(); // Qué hace: crea el enrutador de usuarios, donde se definen sus endpoints
const userController = require('../controllers/user.controller');

// Cómo se lee: "Router punto post en la raíz con userController punto create."
router.post('/', userController.create); // Qué hace: POST /api/users crea un usuario

// Cómo se lee: "Router punto get en la raíz con userController punto getAll."
router.get('/', userController.getAll); // Qué hace: GET /api/users devuelve todos (el que llena los checkboxes)

// Cómo se lee: "Router punto get, pasando /:userId/tasks y userController punto getUserTasks."
// Qué es: la ruta que usa searchUser para traer las tareas que ya tiene asignadas un usuario.
router.get('/:userId/tasks', userController.getUserTasks); // Qué hace: el JOIN entre task_users y tasks para devolverlas

// Cómo se lee: "Router punto get con /:id."
router.get('/:id', userController.getById); // Qué hace: GET /api/users/:id devuelve un usuario

// Cómo se lee: "Router punto put con /:id."
router.put('/:id', userController.update); // Qué hace: PUT /api/users/:id actualiza el usuario

// Cómo se lee: "Router punto delete con /:id."
router.delete('/:id', userController.remove); // Qué hace: DELETE /api/users/:id borra el usuario

// Cómo se lee: "Router punto patch con /:id/status."
router.patch('/:id/status', userController.toggleStatus); // Qué hace: PATCH /api/users/:id/status activa o inactiva el usuario

// Cómo se lee: "Module punto exports se asigna a router."
module.exports = router; // Qué hace: entrega el enrutador para montarlo en index.js bajo /api/users
