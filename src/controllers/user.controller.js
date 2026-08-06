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

exports.getUserTasks = async (req, res) => { // "exports.getUserTasks" exporta la función "getUserTasks"; "async" permite "await"; "(req, res)" recibe la petición y la respuesta; la llave abre el bloque: es el endpoint GET /api/users/:userId/tasks que devuelve las tareas asignadas a un usuario
  try { // "try" abre el bloque protegido
    const user = await UserModel.findById(req.params.userId); // "const" declara; "user" guarda el resultado; "await" espera; "UserModel.findById" busca al usuario; "req.params.userId" es el id que capturó ":userId" en la URL; esto valida que el usuario exista antes de consultar
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' }); // "if" pregunta si el usuario no existe; "return" termina; "res.status(404)" responde no encontrado; ".json" envía el mensaje
    const tasks = await TaskModel.findByUserId(req.params.userId); // "const" declara; "tasks" guarda el resultado; "await" espera; "TaskModel.findByUserId" hace el JOIN con "task_users" para traer solo las tareas que le fueron asignadas a ese usuario
    res.json(tasks); // "res.json" envía; "tasks" es el array de tareas asignadas, cada una con su propiedad "assignedUsers" para que el frontend las muestre en la tabla
  } catch (error) { // "catch" atrapa el error
    res.status(500).json({ message: 'Error al obtener tareas del usuario', error: error.message }); // "res.status(500)" responde con error del servidor; ".json" envía el mensaje general y el detalle técnico
  } // la llave cierra el "catch"
};
