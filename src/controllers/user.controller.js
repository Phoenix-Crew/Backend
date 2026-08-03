// ============================================================
// user.controller.js — Controlador de usuarios
// ============================================================
// CRUD completo de usuarios + consulta de tareas por usuario.
// Usa UserModel (persistencia en MySQL) y retorna JSON con
// los datos del usuario (sin password).

const { UserModel, TaskModel } = require('../models');

// POST /api/users — Crear un nuevo usuario
exports.create = async (req, res) => {
  try {
    const { name, email, rol, password } = req.body;
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

    const existing = await UserModel.findByEmail(email.trim());
    if (existing) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: email.trim(),
      rol: rol.trim(),
      password,
      ficha: req.body.ficha
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// GET /api/users — Listar todos los usuarios (sin password)
exports.getAll = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// GET /api/users/:id — Obtener un usuario por ID (sin password)
exports.getById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// PUT /api/users/:id — Actualizar un usuario
exports.update = async (req, res) => {
  try {
    const { name, email, rol, password, ficha } = req.body;
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: 'El nombre no puede estar vacío' });
    }
    if (email !== undefined && !email.trim()) {
      return res.status(400).json({ message: 'El email no puede estar vacío' });
    }
    if (rol !== undefined && !rol.trim()) {
      return res.status(400).json({ message: 'El rol no puede estar vacío' });
    }

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

// DELETE /api/users/:id — Eliminar un usuario
exports.remove = async (req, res) => {
  try {
    const ok = await UserModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// PATCH /api/users/:id/status — Activar/desactivar un usuario
exports.toggleStatus = async (req, res) => {
  try {
    const { active } = req.body;
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

// GET /api/users/:userId/tasks — Tareas asignadas a un usuario (JOIN con tasks)
exports.getUserTasks = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const tasks = await TaskModel.findByUserId(req.params.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas del usuario', error: error.message });
  }
};