// ============================================================
// task.controller.js — Controlador CRUD de tareas
// ============================================================
// Cada funcion maneja la logica de negocio de un endpoint.
// Usa TaskModel (persistencia en MySQL con tabla task_users).

const { TaskModel } = require('../models');

// create — POST /api/tasks — Crea una nueva tarea con assignedUsers
exports.create = async (req, res) => {
  try {
    const { title, description, assignedUsers } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'El título es obligatorio' });
    }

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

// getAll — GET /api/tasks — Retorna todas las tareas con sus usuarios asignados
exports.getAll = async (req, res) => {
  try {
    const tasks = await TaskModel.findAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

// getById — GET /api/tasks/:id — Retorna una tarea por su ID
exports.getById = async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tarea', error: error.message });
  }
};

// update — PUT|PATCH /api/tasks/:id — Actualiza parcial o totalmente una tarea
exports.update = async (req, res) => {
  try {
    if (req.body.title !== undefined && !req.body.title.trim()) {
      return res.status(400).json({ message: 'El título no puede estar vacío' });
    }

    const task = await TaskModel.update(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};

// remove — DELETE /api/tasks/:id — Elimina una tarea
exports.remove = async (req, res) => {
  try {
    const ok = await TaskModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json({ message: 'Tarea eliminada con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar', error: error.message });
  }
};

// updateStatus — PATCH /api/tasks/:id/status — Cambia solo el estado de una tarea
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
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

// assignUsers — POST /api/tasks/:taskId/assign — Agrega un usuario a la tarea (task_users)
exports.assignUsers = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { id, name } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'El id del usuario es obligatorio' });
    }

    const current = await TaskModel.getAssignedUsers(taskId);
    if (!current) return res.status(404).json({ message: 'Tarea no encontrada' });
    if (current.some((u) => String(u.id) === String(id))) {
      return res.status(400).json({ message: 'El usuario ya está asignado' });
    }

    const task = await TaskModel.assignUsers(taskId, [{ id, name }]);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// getAssignedUsers — GET /api/tasks/:taskId/users — Retorna los usuarios asignados a una tarea
exports.getAssignedUsers = async (req, res) => {
  try {
    const users = await TaskModel.getAssignedUsers(req.params.taskId);
    if (!users) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// removeUserAssignment — DELETE /api/tasks/:taskId/users/:userId — Quita la asignación
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

// filter — GET /api/tasks/filter — Filtra tareas por status, userId, dateFrom y dateTo
exports.filter = async (req, res) => {
  try {
    const tasks = await TaskModel.filter(req.query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// getDashboard — GET /api/dashboard — Estadisticas globales (agregados SQL)
exports.getDashboard = async (req, res) => {
  try {
    const stats = await TaskModel.getDashboard();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};