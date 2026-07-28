// ============================================================
// user.controller.js — Controlador de usuarios
// ============================================================
// CRUD completo de usuarios + consulta de tareas por usuario.
// Cada funcion recibe (req, res), lee/escribe en db.json
// y retorna JSON con los datos del usuario (sin password).

const { readDB, writeDB } = require('../models');

// POST /api/users — Crear un nuevo usuario
exports.create = (req, res) => {
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

    const db = readDB();
    const maxId = db.users.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0);
    const newUser = {
      id: String(maxId + 1),
      name: name.trim(),
      email: email.trim(),
      rol: rol.trim(),
      password: password,
      active: true,
      ficha: req.body.ficha || '3315656'
    };
    db.users.push(newUser);
    writeDB(db);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// GET /api/users — Listar todos los usuarios (sin password)
exports.getAll = (req, res) => {
  const { users } = readDB();
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
};

// GET /api/users/:id — Obtener un usuario por ID (sin password)
exports.getById = (req, res) => {
  const { users } = readDB();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
};

// PUT /api/users/:id — Actualizar un usuario
exports.update = (req, res) => {
  try {
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Usuario no encontrado' });

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

    const updated = { ...db.users[idx] };
    if (name !== undefined) updated.name = name.trim();
    if (email !== undefined) updated.email = email.trim();
    if (rol !== undefined) updated.rol = rol.trim();
    if (password !== undefined) updated.password = password;
    if (ficha !== undefined) updated.ficha = ficha;

    db.users[idx] = updated;
    writeDB(db);
    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// DELETE /api/users/:id — Eliminar un usuario
exports.remove = (req, res) => {
  try {
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Usuario no encontrado' });
    db.users.splice(idx, 1);
    writeDB(db);
    res.json({ message: 'Usuario eliminado con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// PATCH /api/users/:id/status — Activar/desactivar un usuario
exports.toggleStatus = (req, res) => {
  try {
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { active } = req.body;
    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'El campo active debe ser booleano' });
    }

    db.users[idx].active = active;
    writeDB(db);
    const { password, ...safeUser } = db.users[idx];
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
  }
};

// GET /api/users/:userId/tasks — Tareas asignadas a un usuario
exports.getUserTasks = (req, res) => {
  const { tasks } = readDB();
  const userTasks = tasks.filter(t => {
    // Formato nuevo: assignedUsers como array de objetos { id, name }
    if (Array.isArray(t.assignedUsers)) {
      return t.assignedUsers.some(u => String(u.id) === String(req.params.userId));
    }
    // Formato alternativo: userIds como array de strings
    if (Array.isArray(t.userIds)) {
      return t.userIds.includes(req.params.userId);
    }
    // Formato legacy: userId como string
    return String(t.userId) === String(req.params.userId);
  });
  res.json(userTasks);
};
