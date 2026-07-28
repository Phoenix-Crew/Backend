import { TaskModel } from "../models/task.model.js";

// =================================================================
// [B2 - Stiven] Refactorizar para usar modelos con BD
// =================================================================
// Los controladores ya están desacoplados de la persistencia.
// Solo validan datos y delegan en TaskModel/UserModel.
// Cuando B1 esté listo, estos controladores funcionarán sin cambios.
// =================================================================

const ok = (res, data, message = "Operación exitosa", status = 200) =>
  res.status(status).json({ success: true, message, data, errors: [] });

const fail = (res, message = "Error", status = 500, errors = []) =>
  res.status(status).json({ success: false, message, data: null, errors });

export const getAll = (req, res) => {
  try {
    const tasks = TaskModel.findAll();
    ok(res, tasks, "Lista de tareas");
  } catch (error) {
    fail(res, "Error al obtener tareas");
  }
};

export const getById = (req, res) => {
  try {
    const task = TaskModel.findById(req.params.id);
    if (!task) return fail(res, `Tarea con ID ${req.params.id} no encontrada`, 404);
    ok(res, task, "Tarea encontrada");
  } catch (error) {
    fail(res, "Error al buscar la tarea");
  }
};

export const create = (req, res) => {
  try {
    const { title, description, assignedUsers } = req.body;
    if (!title || !title.trim()) {
      return fail(res, "El título es obligatorio", 400);
    }
    const newTask = TaskModel.create({ title, description, assignedUsers });
    ok(res, newTask, "Tarea creada correctamente", 201);
  } catch (error) {
    fail(res, "Error al crear la tarea");
  }
};

export const update = (req, res) => {
  try {
    if (req.body.title !== undefined && !req.body.title.trim()) {
      return fail(res, "El título no puede estar vacío", 400);
    }
    const updated = TaskModel.update(req.params.id, req.body);
    if (!updated) return fail(res, `Tarea con ID ${req.params.id} no encontrada`, 404);
    ok(res, updated, "Tarea actualizada correctamente");
  } catch (error) {
    fail(res, "Error al actualizar la tarea");
  }
};

export const remove = (req, res) => {
  try {
    const deleted = TaskModel.delete(req.params.id);
    if (!deleted) return fail(res, `Tarea con ID ${req.params.id} no encontrada`, 404);
    ok(res, { id: req.params.id }, "Tarea eliminada correctamente");
  } catch (error) {
    fail(res, "Error al eliminar la tarea");
  }
};

export const updateStatus = (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pendiente", "En progreso", "Completada"];
    if (!status || !validStatuses.includes(status)) {
      return fail(res, "Estado inválido. Use: Pendiente, En progreso o Completada", 400);
    }
    const updated = TaskModel.update(req.params.id, { status });
    if (!updated) return fail(res, `Tarea con ID ${req.params.id} no encontrada`, 404);
    ok(res, updated, "Estado actualizado correctamente");
  } catch (error) {
    fail(res, "Error al actualizar el estado");
  }
};

export const assignUsers = (req, res) => {
  try {
    const { taskId } = req.params;
    const { id, name } = req.body;
    const task = TaskModel.findById(taskId);
    if (!task) return fail(res, `Tarea con ID ${taskId} no encontrada`, 404);

    if (!task.assignedUsers) task.assignedUsers = [];
    const userExists = task.assignedUsers.some((u) => u.id === id);
    if (userExists) return fail(res, "El usuario ya está asignado a esta tarea", 400);

    task.assignedUsers.push({ id, name });
    const updated = TaskModel.update(taskId, { assignedUsers: task.assignedUsers });
    ok(res, updated, "Usuario asignado correctamente");
  } catch (error) {
    fail(res, "Error al asignar usuario");
  }
};

export const getAssignedUsers = (req, res) => {
  try {
    const task = TaskModel.findById(req.params.taskId);
    if (!task) return fail(res, `Tarea con ID ${req.params.taskId} no encontrada`, 404);
    ok(res, task.assignedUsers || [], "Usuarios asignados a la tarea");
  } catch (error) {
    fail(res, "Error al obtener usuarios asignados");
  }
};

export const removeUserAssignment = (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const task = TaskModel.findById(taskId);
    if (!task) return fail(res, `Tarea con ID ${taskId} no encontrada`, 404);

    if (task.assignedUsers) {
      task.assignedUsers = task.assignedUsers.filter((u) => u.id !== userId);
      TaskModel.update(taskId, { assignedUsers: task.assignedUsers });
    }
    ok(res, task, "Usuario removido de la tarea");
  } catch (error) {
    fail(res, "Error al remover usuario de la tarea");
  }
};

export const filter = (req, res) => {
  try {
    const tasks = TaskModel.filter(req.query);
    ok(res, tasks, "Tareas filtradas correctamente");
  } catch (error) {
    fail(res, "Error al filtrar tareas");
  }
};

export const getDashboard = (req, res) => {
  try {
    const dashboard = TaskModel.getDashboard();
    ok(res, dashboard, "Estadísticas del dashboard");
  } catch (error) {
    fail(res, "Error al obtener estadísticas");
  }
};

export const getUserTasks = (req, res) => {
  try {
    const tasks = TaskModel.findByUserId(req.params.userId);
    ok(res, tasks, `Tareas del usuario ${req.params.userId}`);
  } catch (error) {
    fail(res, "Error al obtener tareas del usuario");
  }
};
