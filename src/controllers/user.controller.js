// ============================================================
// user.controller.js — Controlador de usuarios
// ============================================================
// FLUJO: rutas /api/users/* (user.routes.js)
// → funciones de este archivo (validan y coordinan)
// → UserModel / TaskModel (persistencia MySQL)
// → respuesta JSON (sin password en las respuestas)
// ============================================================

// Importa los modelos: UserModel (CRUD usuarios) y TaskModel (tareas del usuario)
// Vienen de: models/index.js
const { UserModel, TaskModel } = require('../models');

// ============================================================
// create — POST /api/users
// ORIGEN: user.routes.js → DESTINO: UserModel.create (INSERT)
// FLUJO: valida campos → verifica email duplicado → INSERT → responde 201 con el usuario
// ============================================================
exports.create = async (req, res) => {
  try {
    // Extrae del body los datos del nuevo usuario
    const { name, email, rol, password } = req.body;
    // Validaciones: nombre, email y rol obligatorios; password mínimo 6 caracteres
    // Cada fallo responde 400 con el motivo (no llega a la BD)
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'El email es obligatorio' });
    }
    if (!rol || !rol.trim()) {
      return res.status(400).json({ message: 'El rol es obligatorio' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verifica que el email no esté registrado (SELECT por email)
    const existing = await UserModel.findByEmail(email.trim());
    if (existing) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Inserta el usuario en MySQL (INSERT INTO users ...) y devuelve el registro creado
    const user = await UserModel.create({
      name: name.trim(),
      email: email.trim(),
      rol: rol.trim(),
      password,
      ficha: req.body.ficha
    });
    res.status(201).json(user); // 201 = recurso creado
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// ============================================================
// getAll — GET /api/users
// ORIGEN: user.routes.js → DESTINO: UserModel.findAll
// FLUJO: SELECT de todos los usuarios (sin password) → JSON
// QUIÉN LO CONSUME: frontend usersService.loadUsers y tareasService.searchUser
// ============================================================
exports.getAll = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// ============================================================
// getById — GET /api/users/:id
// ORIGEN: user.routes.js → DESTINO: UserModel.findById (SELECT WHERE id = ?)
// QUÉ DEVUELVE: el usuario o 404 si no existe
// ============================================================
exports.getById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// ============================================================
// update — PUT /api/users/:id
// ORIGEN: user.routes.js → DESTINO: UserModel.update (UPDATE parcial)
// FLUJO: valida que los campos no vengan vacíos → UPDATE → responde el usuario actualizado
// ============================================================
exports.update = async (req, res) => {
  try {
    // Extrae los campos editables del body (pueden venir todos o solo algunos)
    const { name, email, rol, password, ficha } = req.body;
    // Si un campo viene definido pero vacío → 400
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: 'El nombre no puede estar vacío' });
    }
    if (email !== undefined && !email.trim()) {
      return res.status(400).json({ message: 'El email no puede estar vacío' });
    }
    if (rol !== undefined && !rol.trim()) {
      return res.status(400).json({ message: 'El rol no puede estar vacío' });
    }

    // Ejecuta el UPDATE (solo los campos definidos) y relee el usuario actualizado
    const user = await UserModel.update(req.params.id, {
      name,
      email,
      rol,
      password,
      ficha
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// ============================================================
// remove — DELETE /api/users/:id
// ORIGEN: user.routes.js → DESTINO: UserModel.delete
// FLUJO: DELETE FROM users → responde mensaje. Las asignaciones en
// task_users se borran solas por la FK con ON DELETE CASCADE
// ============================================================
exports.remove = async (req, res) => {
  try {
    const ok = await UserModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// ============================================================
// toggleStatus — PATCH /api/users/:id/status
// ORIGEN: user.routes.js → DESTINO: UserModel.updateActive
// FLUJO: recibe { active: true/false } del frontend → UPDATE → usuario actualizado
// ============================================================
exports.toggleStatus = async (req, res) => {
  try {
    const { active } = req.body;
    // Valida que active sea realmente un booleano (no un string "true")
    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'El campo active debe ser booleano' });
    }

    const user = await UserModel.updateActive(req.params.id, active);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
  }
};

// ============================================================
// getUserTasks — GET /api/users/:userId/tasks
// ORIGEN: user.routes.js (DEBE ir antes de /:id en el router)
// DESTINO: UserModel.findById (valida) + TaskModel.findByUserId
// FLUJO: SELECT tasks JOIN task_users WHERE user_id = ? → tareas del usuario
// QUIÉN LO CONSUME: frontend tareasService.searchUser → fetchTasksByUser
// ============================================================
exports.getUserTasks = async (req, res) => {
  try {
    // Verifica que el usuario exista (si no → 404)
    const user = await UserModel.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Busca las tareas asignadas a ese usuario (JOIN con task_users)
    const tasks = await TaskModel.findByUserId(req.params.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas del usuario', error: error.message });
  }
};
