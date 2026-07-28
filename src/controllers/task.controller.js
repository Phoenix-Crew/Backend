// ============================================================
// task.controller.js — Controlador CRUD de tareas
// ============================================================
// Cada funcion maneja la logica de negocio de un endpoint.
// Lee/escribe en db.json a traves de readDB/writeDB.
//
// [B2 - Stiven] Verificar que funciones con BD real
// ============================================================
// Cuando B1 migre models/index.js a SQL, estos controladores
// deben seguir funcionando SIN cambios porque dependen de
// readDB/writeDB que tendrán la misma interfaz.
// Probar cada método contra la BD.
// ============================================================

const { readDB, writeDB } = require('../models');

// create — POST /api/tasks — Crea una nueva tarea con assignedUsers
exports.create = (req, res) => {
  try {
    const { title, description, assignedUsers } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'El título es obligatorio' });
    }
    const db = readDB();
    const maxId = db.tasks.reduce((max, t) => Math.max(max, parseInt(t.id) || 0), 0);
    const newTask = {
      id: String(maxId + 1),
      title: title.trim(),
      description: (description || '').trim(),
      status: 'Pendiente',
      createdAt: new Date().toLocaleString('es-CO'),
      assignedUsers: assignedUsers || []
    };
    db.tasks.push(newTask);
    writeDB(db);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la tarea', error: error.message });
  }
};

// getAll — GET /api/tasks — Retorna todas las tareas
exports.getAll = (req, res) => {
  const { tasks } = readDB();
  res.json(tasks);
};

// getById — GET /api/tasks/:id — Retorna una tarea por su ID
exports.getById = (req, res) => {
  const { tasks } = readDB();
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
  res.json(task);
};

// update — PUT|PATCH /api/tasks/:id — Actualiza parcial o totalmente una tarea
exports.update = (req, res) => {
  try {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Tarea no encontrada' });

    if (req.body.title !== undefined && !req.body.title.trim()) {
      return res.status(400).json({ message: 'El título no puede estar vacío' });
    }

    db.tasks[idx] = { ...db.tasks[idx], ...req.body };
    writeDB(db);
    res.json(db.tasks[idx]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};

// remove — DELETE /api/tasks/:id — Elimina una tarea del array
exports.remove = (req, res) => {
  try {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Tarea no encontrada' });
    db.tasks.splice(idx, 1);
    writeDB(db);
    res.json({ message: 'Tarea eliminada con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar', error: error.message });
  }
};

// updateStatus — PATCH /api/tasks/:id/status — Cambia solo el estado de una tarea
exports.updateStatus = (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pendiente', 'En progreso', 'Completada'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    const db = readDB();
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Tarea no encontrada' });
    db.tasks[idx].status = status;
    writeDB(db);
    res.json(db.tasks[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// assignUsers — POST /api/tasks/:taskId/assign — Agrega un usuario al array assignedUsers
exports.assignUsers = (req, res) => {
  try {
    const db = readDB();
    const { taskId } = req.params;
    const { id, name } = req.body;
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    if (!task.assignedUsers) task.assignedUsers = [];
    const userExists = task.assignedUsers.some(u => u.id === id);
    if (userExists) return res.status(400).json({ message: 'El usuario ya está asignado' });
    task.assignedUsers.push({ id, name });
    writeDB(db);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// getAssignedUsers — GET /api/tasks/:taskId/users — Retorna los usuarios asignados a una tarea
exports.getAssignedUsers = (req, res) => {
  const { tasks } = readDB();
  const task = tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
  res.json(task.assignedUsers || []);
};

// removeUserAssignment — DELETE /api/tasks/:taskId/users/:userId — Quita un usuario de assignedUsers
exports.removeUserAssignment = (req, res) => {
  try {
    const db = readDB();
    const { taskId, userId } = req.params;
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    if (task.assignedUsers) {
      task.assignedUsers = task.assignedUsers.filter(u => u.id !== userId);
      writeDB(db);
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// filter — GET /api/tasks/filter — Filtra tareas por status, userId, dateFrom y dateTo
exports.filter = (req, res) => {
  let { tasks } = readDB();
  const { status, userId, dateFrom, dateTo } = req.query;

  if (userId) {
    tasks = tasks.filter(task =>
      task.assignedUsers && task.assignedUsers.some(u => String(u.id) === String(userId))
    );
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  if (dateFrom) {
    const from = new Date(dateFrom);
    tasks = tasks.filter(t => new Date(t.createdAt) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    tasks = tasks.filter(t => new Date(t.createdAt) <= to);
  }
  res.json(tasks);
};

// getDashboard — GET /api/dashboard — Estadisticas globales: totales por estado y por usuario
exports.getDashboard = (req, res) => {
  const { tasks, users } = readDB();
  const total = tasks.length;
  const completadas = tasks.filter(t => t.status === 'Completada').length;
  const pendientes = tasks.filter(t => t.status === 'Pendiente').length;
  const enProgreso = tasks.filter(t => t.status === 'En progreso').length;

  const userMap = {};
  tasks.forEach(t => {
    if (t.assignedUsers) {
      t.assignedUsers.forEach(u => {
        const uid = String(u.id);
        if (!userMap[uid]) {
          userMap[uid] = { userId: uid, userName: u.name, count: 0 };
        }
        userMap[uid].count++;
      });
    }
  });
  const porUsuario = Object.values(userMap);

  res.json({
    total, completadas, pendientes, enProgreso,
    porStatus: [
      { status: 'Pendiente', count: pendientes },
      { status: 'En progreso', count: enProgreso },
      { status: 'Completada', count: completadas }
    ],
    porUsuario,
    totalUsuarios: users.length
  });
};
