const { TaskModel } = require('../models');

exports.create = async (req, res) => { // "exports.create" exporta la función con nombre "create"; "async" permite usar "await"; "(req, res)" recibe la petición del cliente y la respuesta que se enviará; la flecha "=>" define la función; la llave abre el bloque: es el endpoint POST /api/tasks que crea la tarea y asigna los usuarios marcados en el frontend
  try { // "try" abre el bloque protegido: cualquier error dentro pasa al "catch"
    const { title, description, assignedUsers } = req.body; // "const" crea constantes; las llaves desestructuran "req.body" (el JSON enviado por el frontend) en "title", "description" y "assignedUsers"; "assignedUsers" es el array de objetos [{ id, name }] que el frontend armó con los checkboxes marcados
    if (!title || !title.trim()) { // "if" pregunta; "!title" es "si el título no viene"; "||" significa "o"; "!title.trim()" es "si el título viene vacío o solo con espacios"; si se cumple alguna de las dos, entra al bloque
      return res.status(400).json({ message: 'El título es obligatorio' }); // "return" termina aquí; "res" es la respuesta; ".status(400)" le pone el código HTTP de petición inválida; ".json" envía un JSON con el "message" que explica que el título es obligatorio
    } // la llave cierra el bloque del "if"
    const task = await TaskModel.create({ // "const" declara; "task" guardará la tarea creada; "await" espera a que termine; "TaskModel.create" es el método del modelo; la llave abre el objeto de datos que se envía
      title: title.trim(), // "title" es la propiedad; "title.trim()" es el título sin espacios sobrantes
      description: (description || '').trim(), // "description" es la propiedad; "(description || '')" usa la descripción o, si no viene, un texto vacío; ".trim()" quita los espacios sobrantes
      assignedUsers: assignedUsers || [] // "assignedUsers" es la propiedad clave: usa el array enviado por el frontend o, si no viene, un array vacío; este array es lo que se inserta en la tabla "task_users"
    }); // la llave cierra el objeto y el paréntesis cierra la llamada
    res.status(201).json(task); // "res" es la respuesta; ".status(201)" pone el código de recurso creado; ".json" envía; "task" es la tarea guardada que ya trae su array "assignedUsers" lleno
  } catch (error) { // "catch" atrapa cualquier error del "try"; "error" es ese error
    res.status(500).json({ message: 'Error al crear la tarea', error: error.message }); // "res.status(500)" responde con error interno del servidor; ".json" envía el "message" general y el detalle técnico en "error.message"
  } // la llave cierra el bloque del "catch"
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

exports.assignUsers = async (req, res) => { // "exports.assignUsers" exporta la función "assignUsers"; "async" permite "await"; "(req, res)" recibe la petición y la respuesta; la llave abre el bloque: es el endpoint POST /api/tasks/:taskId/assign que asigna un usuario a una tarea ya existente
  try { // "try" abre el bloque protegido
    const { taskId } = req.params; // "const" declara; las llaves desestructuran "req.params" (los parámetros de la URL) en "taskId"; "req.params" trae el valor que capturó ":taskId" en la ruta
    const { id, name } = req.body; // "const" declara; las llaves desestructuran "req.body" en "id" y "name"; "req.body" es el JSON que envía el frontend con el usuario a asignar, o sea el objeto { id, name }
    if (!id) { // "if" pregunta si "id" no viene; "!id" niega y significa "si no hay id de usuario"
      return res.status(400).json({ message: 'El id del usuario es obligatorio' }); // "return" termina aquí; "res.status(400)" responde con petición inválida; ".json" envía el mensaje de que el id del usuario es obligatorio
    } // la llave cierra el "if"
    const current = await TaskModel.getAssignedUsers(taskId); // "const" declara; "current" guarda el resultado; "await" espera; "TaskModel.getAssignedUsers(taskId)" consulta los usuarios ya asignados a la tarea y de paso valida que la tarea exista
    if (!current) return res.status(404).json({ message: 'Tarea no encontrada' }); // "if" pregunta si "current" es null (la tarea no existe); "return" termina; "res.status(404)" responde con no encontrado; ".json" envía el mensaje
    if (current.some((u) => String(u.id) === String(id))) { // "if" pregunta; "current.some" revisa si algún elemento cumple la condición; "u" es cada usuario ya asignado; "String(u.id) === String(id)" compara su id con el que se quiere asignar; si coinciden, el usuario ya está asignado
      return res.status(400).json({ message: 'El usuario ya está asignado' }); // "return" termina aquí; "res.status(400)" responde con petición inválida; ".json" avisa que no se puede asignar dos veces al mismo usuario
    } // la llave cierra el "if"
    const task = await TaskModel.assignUsers(taskId, [{ id, name }]); // "const" declara; "task" guardará la tarea actualizada; "await" espera; "TaskModel.assignUsers" inserta la asignación; "taskId" es la tarea y "[{ id, name }]" es un array con el usuario a asignar, que se guarda en "task_users"
    res.json(task); // "res" es la respuesta; ".json" envía; "task" es la tarea con sus asignados actualizados para que el frontend refresque los badges
  } catch (error) { // "catch" atrapa cualquier error; "error" es ese error
    res.status(500).json({ error: error.message }); // "res.status(500)" responde con error del servidor; ".json" envía el detalle técnico del error
  } // la llave cierra el "catch"
};

exports.getAssignedUsers = async (req, res) => { // "exports.getAssignedUsers" exporta la función "getAssignedUsers"; "async" permite "await"; "(req, res)" recibe la petición y la respuesta; es el endpoint GET /api/tasks/:taskId/users que devuelve los usuarios asignados a la tarea
  try { // "try" abre el bloque protegido
    const users = await TaskModel.getAssignedUsers(req.params.taskId); // "const" declara; "users" guarda el resultado; "await" espera; "TaskModel.getAssignedUsers" consulta; "req.params.taskId" es el id de la tarea que viene en la URL
    if (!users) return res.status(404).json({ message: 'Tarea no encontrada' }); // "if" pregunta si "users" es null (tarea inexistente); "return" termina; "res.status(404)" responde no encontrado; ".json" envía el mensaje
    res.json(users); // "res.json" envía; "users" es el array [{ id, name }] de usuarios asignados a la tarea
  } catch (error) { // "catch" atrapa el error
    res.status(500).json({ error: error.message }); // "res.status(500)" responde con error del servidor; ".json" envía el detalle
  } // la llave cierra el "catch"
};

exports.removeUserAssignment = async (req, res) => { // "exports.removeUserAssignment" exporta la función "removeUserAssignment"; "async" permite "await"; "(req, res)" recibe la petición y la respuesta; es el endpoint DELETE /api/tasks/:taskId/users/:userId que quita un usuario de la tarea
  try { // "try" abre el bloque protegido
    const { taskId, userId } = req.params; // "const" declara; las llaves desestructuran "req.params" en "taskId" y "userId"; la URL trae el id de la tarea y el id del usuario a desasignar
    const task = await TaskModel.removeUserAssignment(taskId, userId); // "const" declara; "task" guarda la tarea actualizada; "await" espera; "TaskModel.removeUserAssignment(taskId, userId)" borra la fila de "task_users" que une a ese usuario con esa tarea
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' }); // "if" pregunta si la tarea no existe; "return" termina; "res.status(404)" responde no encontrado; ".json" envía el mensaje
    res.json(task); // "res.json" envía; "task" es la tarea ya sin ese usuario asignado
  } catch (error) { // "catch" atrapa el error
    res.status(500).json({ error: error.message }); // "res.status(500)" responde con error del servidor; ".json" envía el detalle
  } // la llave cierra el "catch"
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
