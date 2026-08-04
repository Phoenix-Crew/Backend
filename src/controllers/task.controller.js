// ============================================================
// task.controller.js — Controlador CRUD de tareas
// ============================================================
// FLUJO: rutas /api/tasks/* (task.routes.js)
// → funciones de este archivo (validan y coordinan)
// → TaskModel (persistencia en MySQL: tablas tasks y task_users)
// → respuesta JSON
// ============================================================

// Importa TaskModel (capa de persistencia de tareas)
// Viene de: models/index.js
const { TaskModel } = require('../models');

// ============================================================
// create — POST /api/tasks
// ORIGEN: task.routes.js → DESTINO: TaskModel.create
// FLUJO: valida título → INSERT de la tarea + asignaciones en task_users
// (todo en una transacción) → responde 201 con la tarea creada
// QUIÉN LO CONSUME: frontend tareasService.registerTask → createTask
// ============================================================
exports.create = async (req, res) => {
  try {
    const { title, description, assignedUsers } = req.body;
    // El título es obligatorio
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'El título es obligatorio' });
    }

    // Crea la tarea; assignedUsers es un array [{ id, name }] que se inserta en task_users
    const task = await TaskModel.create({
      title: title.trim(),
      description: (description || '').trim(),
      assignedUsers: assignedUsers || []
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la tarea', error: error.message });
  }
};

// ============================================================
// getAll — GET /api/tasks
// ORIGEN: task.routes.js → DESTINO: TaskModel.findAll
// QUÉ DEVUELVE: todas las tareas con su array assignedUsers (JOIN)
// ============================================================
exports.getAll = async (req, res) => {
  try {
    const tasks = await TaskModel.findAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

// ============================================================
// getById — GET /api/tasks/:id
// ORIGEN: task.routes.js → DESTINO: TaskModel.findById
// QUÉ DEVUELVE: la tarea con asignados o 404
// ============================================================
exports.getById = async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tarea', error: error.message });
  }
};

// ============================================================
// update — PUT|PATCH /api/tasks/:id
// ORIGEN: task.routes.js (rutas PUT y PATCH) → DESTINO: TaskModel.update
// FLUJO: valida título si viene → UPDATE parcial → tarea actualizada
// QUIÉN LO CONSUME: frontend editTaskViaModal → updateTask
// ============================================================
exports.update = async (req, res) => {
  try {
    // Si el frontend envía title vacío → 400
    if (req.body.title !== undefined && !req.body.title.trim()) {
      return res.status(400).json({ message: 'El título no puede estar vacío' });
    }

    // TaskModel.update arma el UPDATE solo con los campos definidos
    const task = await TaskModel.update(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};

// ============================================================
// remove — DELETE /api/tasks/:id
// ORIGEN: task.routes.js → DESTINO: TaskModel.delete
// FLUJO: DELETE FROM tasks; las filas de task_users se borran por CASCADE
// ============================================================
exports.remove = async (req, res) => {
  try {
    const ok = await TaskModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json({ message: 'Tarea eliminada con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar', error: error.message });
  }
};

// ============================================================
// updateStatus — PATCH /api/tasks/:id/status
// ORIGEN: task.routes.js → DESTINO: TaskModel.updateStatus
// FLUJO: valida el estado contra los 3 permitidos → UPDATE solo del status
// QUIÉN LO CONSUME: frontend (botón "Completar" → completeTaskDirect usa updateTask)
// ============================================================
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    // Estados válidos definidos en la BD (ENUM de la tabla tasks)
    const validStatuses = ['Pendiente', 'En progreso', 'Completada'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const task = await TaskModel.updateStatus(req.params.id, status);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// ============================================================
// assignUsers — POST /api/tasks/:taskId/assign
// ORIGEN: task.routes.js → DESTINO: TaskModel.assignUsers
// FLUJO: valida el id del usuario → comprueba que no esté ya asignado
// → INSERT en task_users (transacción) → tarea con asignados
// QUIÉN LO CONSUME: frontend tareasApi.assignTask
// ============================================================
exports.assignUsers = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { id, name } = req.body; // El body trae el usuario a asignar
    if (!id) {
      return res.status(400).json({ message: 'El id del usuario es obligatorio' });
    }

    // Verifica que la tarea exista y trae sus asignados actuales
    const current = await TaskModel.getAssignedUsers(taskId);
    if (!current) return res.status(404).json({ message: 'Tarea no encontrada' });
    // Evita duplicados: si el usuario ya está asignado → 400
    if (current.some((u) => String(u.id) === String(id))) {
      return res.status(400).json({ message: 'El usuario ya está asignado' });
    }

    // Inserta la asignación y devuelve la tarea actualizada
    const task = await TaskModel.assignUsers(taskId, [{ id, name }]);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// getAssignedUsers — GET /api/tasks/:taskId/users
// ORIGEN: task.routes.js → DESTINO: TaskModel.getAssignedUsers
// QUÉ DEVUELVE: array [{ id, name }] de la tarea o 404
// ============================================================
exports.getAssignedUsers = async (req, res) => {
  try {
    const users = await TaskModel.getAssignedUsers(req.params.taskId);
    if (!users) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// removeUserAssignment — DELETE /api/tasks/:taskId/users/:userId
// ORIGEN: task.routes.js → DESTINO: TaskModel.removeUserAssignment
// FLUJO: DELETE FROM task_users WHERE task_id y user_id → tarea actualizada
// QUIÉN LO CONSUME: frontend tareasApi.removeUserFromTask
// ============================================================
exports.removeUserAssignment = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const task = await TaskModel.removeUserAssignment(taskId, userId);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// filter — GET /api/tasks/filter
// ORIGEN: task.routes.js → DESTINO: TaskModel.filter
// QUÉ HACE: recibe los query params (status, userId, dateFrom, dateTo)
// y arma dinámicamente el WHERE del SELECT
// QUIÉN LO CONSUME: frontend tareasApi.fetchTasksFiltered (panel admin)
// ============================================================
exports.filter = async (req, res) => {
  try {
    // req.query trae los parámetros de la URL (?status=&userId=&dateFrom=&dateTo=)
    const tasks = await TaskModel.filter(req.query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// getDashboard — GET /api/dashboard
// ORIGEN: src/index.js (app.get('/api/dashboard', ...))
// DESTINO: TaskModel.getDashboard (agregados SQL: COUNT y GROUP BY)
// QUÉ DEVUELVE: total, completadas, pendientes, en progreso,
// porStatus, porUsuario y totalUsuarios
// QUIÉN LO CONSUME: frontend tareasService.loadAdminPanel → fetchDashboard
// ============================================================
exports.getDashboard = async (req, res) => {
  try {
    const stats = await TaskModel.getDashboard();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
