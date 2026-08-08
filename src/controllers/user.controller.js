const { UserModel, TaskModel } = require('../models');

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

exports.getAll = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

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

exports.remove = async (req, res) => {
  try {
    const ok = await UserModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

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

// Cómo se lee: "Exports punto getUserTasks se asigna a una función asíncrona con req y res."
exports.getUserTasks = async (req, res) => { // Qué hace: devuelve las tareas asignadas a ese usuario; la usa searchUser para rellenar la tabla
  try { // Qué hace: intenta traer las tareas; si falla, va al catch
    // Cómo se lee: "Const user se asigna a await UserModel punto findById, pasando el userId que viene en la URL."
    const user = await UserModel.findById(req.params.userId); // Qué hace: verifica primero que el usuario exista
    // Cómo se lee: "If, con la condición no user, return res punto status 404 punto json con el mensaje."
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' }); // Qué hace: si no existe, responde 404 y corta
    // Cómo se lee: "Const tasks se asigna a await TaskModel punto findByUserId, pasando userId."
    // Qué es TaskModel: el modelo de tareas. Vamos a su definición con Ctrl+Click.
    const tasks = await TaskModel.findByUserId(req.params.userId); // Qué hace: hace JOIN task_users con tasks para traer solo las tareas de ese usuario
    // Cómo se lee: "Res punto json pasando tasks."
    res.json(tasks); // Qué hace: devuelve la lista; el frontend la guarda en tasks y la pinta
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas del usuario', error: error.message });
  }
};
