// Cómo se lee: "Const router se asigna a require punto express punto Router."
const router = require('express').Router(); // Qué hace: crea el enrutador de tareas, donde se definen los endpoints
const taskController = require('../controllers/task.controller');

// Cómo se lee: "Router punto post, pasando slash y taskController punto create."
// Qué es: ES EL ENDPOINT del flujo: aquí llega la tarea con su lista assignedUsers.
router.post('/', taskController.create); // Qué hace: cualquier POST a /api/tasks entra aquí y llama a create
// Cómo se lee: "Router punto get en la raíz con taskController punto getAll."
router.get('/', taskController.getAll); // Qué hace: GET /api/tasks devuelve todas las tareas
// Cómo se lee: "Router punto get con /filter y taskController punto filter."
router.get('/filter', taskController.filter); // Qué hace: GET /api/tasks/filter devuelve las tareas con filtros
// Cómo se lee: "Router punto get con /:id y taskController punto getById."
router.get('/:id', taskController.getById); // Qué hace: GET /api/tasks/:id devuelve una tarea
// Cómo se lee: "Router punto put con /:id y taskController punto update."
router.put('/:id', taskController.update); // Qué hace: PUT /api/tasks/:id actualiza la tarea completa
// Cómo se lee: "Router punto patch con /:id/status y taskController punto updateStatus."
router.patch('/:id/status', taskController.updateStatus); // Qué hace: PATCH /api/tasks/:id/status cambia solo el estado
// Cómo se lee: "Router punto patch con /:id y taskController punto update."
router.patch('/:id', taskController.update); // Qué hace: PATCH /api/tasks/:id actualiza parcialmente
// Cómo se lee: "Router punto delete con /:id y taskController punto remove."
router.delete('/:id', taskController.remove); // Qué hace: DELETE /api/tasks/:id borra la tarea
// Cómo se lee: "Router punto post, pasando /:taskId/assign y taskController punto assignUsers."
// Qué es: el endpoint que agrega un usuario a una tarea ya existente.
router.post('/:taskId/assign', taskController.assignUsers); // Qué hace: POST /api/tasks/:taskId/assign crea el vínculo en task_users
// Cómo se lee: "Router punto get, pasando /:taskId/users y taskController punto getAssignedUsers."
router.get('/:taskId/users', taskController.getAssignedUsers); // Qué hace: devuelve los usuarios asignados a esa tarea (los badges del editor)
// Cómo se lee: "Router punto delete, pasando /:taskId/users/:userId y taskController punto removeUserAssignment."
router.delete('/:taskId/users/:userId', taskController.removeUserAssignment); // Qué hace: quita la asignación de un usuario a la tarea

// Cómo se lee: "Module punto exports se asigna a router."
module.exports = router; // Qué hace: entrega el enrutador para montarlo en index.js bajo /api/tasks
