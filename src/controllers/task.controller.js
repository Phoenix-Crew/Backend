const { TaskModel } = require('../models');

// Cómo se lee: "Exports punto create se asigna a una función asíncrona que recibe req y res."
// Qué es: el controlador del POST /api/tasks: la puerta de entrada de la tarea asignada.
exports.create = async (req, res) => { // Qué hace: saca assignedUsers del body y llama a TaskModel.create para guardar todo
  try { // Qué hace: intenta el guardado; si falla, va al catch
    // Cómo se lee: "Const, haciendo destructuring de title, description y assignedUsers desde req punto body."
    // Qué es assignedUsers: el array [{ id, name }] que armó el frontend con los checkboxes marcados.
    const { title, description, assignedUsers } = req.body;
    // Cómo se lee: "If, con la condición no title o no title punto trim."
    if (!title || !title.trim()) { // Qué hace: si el título viene vacío, rechaza la petición antes de tocar la base de datos
      // Cómo se lee: "Return res punto status 400 punto json, con el mensaje."
      return res.status(400).json({ message: 'El título es obligatorio' }); // Qué hace: status 400 = "petición inválida" del lado del cliente
    }
    // Cómo se lee: "Const task se asigna a await TaskModel punto create, pasando un objeto con title,
    // description y assignedUsers."
    // Qué es TaskModel: el modelo de tareas. Vamos a su definición con Ctrl+Click.
    const task = await TaskModel.create({
      title: title.trim(),
      description: (description || '').trim(),
      assignedUsers: assignedUsers || []
    }); // Qué hace: delega al modelo; la transacción guarda la tarea y cada asignación en task_users
    // Cómo se lee: "Res punto status 201 punto json, pasando task."
    res.status(201).json(task); // Qué hace: status 201 = "recurso creado correctamente"; la tarea viaja al frontend ya con su lista assignedUsers completa
  } catch (error) {
    // Cómo se lee: "Res punto status 500 punto json, con el mensaje y error punto message."
    res.status(500).json({ message: 'Error al crear la tarea', error: error.message }); // Qué hace: avisa que falló el guardado con el detalle del error
  }
};

exports.getAll = async (req, res) => {
  try {
    const tasks = await TaskModel.findAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tarea', error: error.message });
  }
};

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

exports.remove = async (req, res) => {
  try {
    const ok = await TaskModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json({ message: 'Tarea eliminada con éxito', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar', error: error.message });
  }
};

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

// Cómo se lee: "Exports punto assignUsers se asigna a una función asíncrona con req y res."
// Qué es: el endpoint que usa el editor cuando tildas y guardas un usuario.
exports.assignUsers = async (req, res) => { // Qué hace: asigna un usuario a una tarea que ya existe, evitando duplicados
  try { // Qué hace: intenta asignar el usuario
    // Cómo se lee: "Const, haciendo destructuring de taskId desde req punto params."
    const { taskId } = req.params; // Qué hace: saca el id de la tarea que viene en la URL
    // Cómo se lee: "Const, haciendo destructuring de id y name desde req punto body."
    const { id, name } = req.body; // Qué hace: saca el usuario que viene en el body del POST
// Cómo se lee: "If, con la condición no id."
    if (!id) { // Qué hace: si el body no trae id, rechaza la petición
      return res.status(400).json({ message: 'El id del usuario es obligatorio' }); // Qué hace: responde 400 con el aviso
    }
    // Cómo se lee: "Const current se asigna a await TaskModel punto getAssignedUsers, pasando taskId."
    const current = await TaskModel.getAssignedUsers(taskId); // Qué hace: trae los usuarios que ya tiene asignados esta tarea
    // Cómo se lee: "If, con no current, return 404."
    if (!current) return res.status(404).json({ message: 'Tarea no encontrada' }); // Qué hace: si la tarea no existe, responde no encontrada
    // Cómo se lee: "If current tiene algún usuario cuyo String id es exactamente igual a String id."
    if (current.some((u) => String(u.id) === String(id))) { // Qué hace: pregunta si ese usuario YA está asignado para no duplicarlo
      return res.status(400).json({ message: 'El usuario ya está asignado' }); // Qué hace: rechaza la asignación duplicada
    }
    // Cómo se lee: "Const task se asigna a await TaskModel.assignUsers, pasando taskId y un array
    // con el objeto id y name."
    const task = await TaskModel.assignUsers(taskId, [{ id, name }]); // Qué hace: inserta la fila en task_users y devuelve la tarea actualizada con sus asignados
    // Cómo se lee: "Res punto json pasando task."
    res.json(task); // Qué hace: devuelve la tarea ya con el nuevo asignado; el frontend repinta los badges
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cómo se lee: "Exports getAssignedUsers: endpoint GET /api/tasks/:taskId/users".
exports.getAssignedUsers = async (req, res) => { // Qué hace: devuelve los usuarios asignados a una tarea (badges en edit)
  try {
    const users = await TaskModel.getAssignedUsers(req.params.taskId);
    if (!users) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cómo se lee: "Exports removeUserAssignment: endpoint DELETE /api/tasks/:taskId/users/:userId".
exports.removeUserAssignment = async (req, res) => { // Qué hace: quita el vínculo de task_users entre esa tarea y ese usuario
  try {
    const { taskId, userId } = req.params;
    const task = await TaskModel.removeUserAssignment(taskId, userId);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.filter = async (req, res) => {
  try {
    const tasks = await TaskModel.filter(req.query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const stats = await TaskModel.getDashboard();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
