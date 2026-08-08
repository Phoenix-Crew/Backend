// Cómo se lee: "const pool se asigna a require de la configuración de la base de datos."
// Qué es: el pool de conexiones a MySQL; con él ejecutamos las queries.
const { pool } = require('../config/database');

// Cómo se lee: "const TASK_FIELDS se asigna al texto con las columnas de tasks, con el alias t punto."
// Qué es: la lista de columnas que se le mandan al frontend: id, title, description, status, createdAt.
const TASK_FIELDS = 't.id, t.title, t.description, t.status, t.createdAt';

// Cómo se lee: "Async function insertAssignments, con conn, taskId y entries como parámetros."
// Qué es: EL CORAZÓN DEL FLUJO en el backend: graba en task_users quién recibe la tarea.
async function insertAssignments(conn, taskId, entries) { // Qué hace: por cada destinatario, pregunta si ya existe la asignación; si no, la inserta
  // Cómo se lee: "Const list se asigna a ternario: si entries es un array, entries; si no, entre corchetes."
  const list = Array.isArray(entries) ? entries : [entries]; // Qué hace: normaliza la entrada para aceptar uno o varios usuarios
  // Cómo se lee: "For, recorriendo const entry de list."
  for (const entry of list) { // Qué hace: recorre cada destinatario a asignar
    // Cómo se lee: "Si no entry, continue."
    if (!entry) continue; // Qué hace: si llega algo vacío, se salta a la siguiente
    // Cómo se lee: "Const userId se asigna a entry punto id, o si no, a entry punto userId, o si no, a entry."
    const userId = entry.id ?? entry.userId ?? entry; // Qué es: acepta los tres formatos que pueden llegar del frontend
    // Cómo se lee: "Si userId es null o undefined, continue."
    if (userId == null) continue; // Qué hace: si no hay id, se salta el destinatario
    // Cómo se lee: "Const, haciendo destructuring entre corchetes de exists, se asigna a await conn punto
    // query, con un SELECT que pregunta si ya existe esa fila en task_users."
    const [exists] = await conn.query(
      'SELECT 1 FROM task_users WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    ); // Qué hace: consulta si ya hay la asignación para evitar duplicados
    // Cómo se lee: "Si exists punto length es exactamente igual a 0, entra al bloque."
    if (exists.length === 0) { // Qué hace: si no existe, entra a crear la asignación
      // Cómo se lee: "Conn punto query con el INSERT en task_users con task_id y user_id."
      // Qué es: así queda guardada la asignación: "la tarea X es del usuario Y".
      await conn.query(
        'INSERT INTO task_users (task_id, user_id) VALUES (?, ?)',
        [taskId, userId]
      ); // Qué hace: inserta la fila de asignación
    }
  }
}

// Cómo se lee: "Async function getAssignedUsersFor, con taskIds como argumento."
// Qué es: la consulta interna que usa findById para llenar assignedUsers.
async function getAssignedUsersFor(taskIds) { // Qué hace: trae los asignados de varias tareas a la vez
  // Cómo se lee: "Si taskIds punto length es igual a 0, return objeto vacío."
  if (taskIds.length === 0) return {}; // Qué hace: si no hay tareas, no consulta y regresa objeto vacío
  // Cómo se lee: "Const placeholders se asigna a taskIds punto map que devuelve signos de pregunta, unidos."
  const placeholders = taskIds.map(() => '?').join(', '); // Qué hace: arma los "?" del IN según cuántas tareas haya
  // Cómo se lee: "Const rows se asigna a await pool punto query, con el SELECT que hace JOIN entre
  // task_users y users para traer el id y el nombre de cada asignado."
  const [rows] = await pool.query(
    `SELECT tu.task_id, u.id, u.name
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      WHERE tu.task_id IN (${placeholders})
      ORDER BY u.id`,
    taskIds
  ); // Qué hace: ejecuta la consulta y obtiene las filas con los asignados
  // Cómo se lee: "Const map se asigna a objeto vacío."
  const map = {}; // Qué es: donde vamos a separar los asignados por tarea
  // Cómo se lee: "Rows invoca un forEach, y por cada fila r."
  rows.forEach((r) => {
    // Cómo se lee: "Si no existe la llave r punto task_id en map, se le asigna un array vacío."
    if (!map[r.task_id]) map[r.task_id] = []; // Qué hace: inicializa la lista de esa tarea la primera vez
    // Cómo se lee: "Map de r punto task_id invoca push de un objeto con id y name."
    map[r.task_id].push({ id: r.id, name: r.name }); // Qué hace: agrega el asignado a su tarea
  });
  // Cómo se lee: "Return map."
  return map; // Qué es el resultado: { 1: [{id, name}], 2: [{id, name}], ... }
}

// Cómo se lee: "Async function hydrate, con tasks."
async function hydrate(tasks) { // Qué hace: recibe tareas de la BD y les agrega la propiedad assignedUsers
  // Cómo se lee: "Si no hay tasks, return array vacío."
  if (!tasks.length) return []; // Qué hace: corta temprano si la consulta no devolvió nada
  // Cómo se lee: "Const map se asigna a await getAssignedUsersFor, pasando map de ids."
  const map = await getAssignedUsersFor(tasks.map((t) => t.id));
  // Cómo se lee: "Return tasks punto map, que por cada tarea devuelve copia con assignedUsers."
  return tasks.map((t) => ({ ...t, assignedUsers: map[t.id] || [] })); // Qué es: sin este paso, el frontend no tendría badges en la columna "Asignados"
}

exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t ORDER BY t.id`);
  return hydrate(rows);
};

// Cómo se lee: "Exports punto findById se asigna a async, pasando id como parámetro."
exports.findById = async (id) => { // Qué hace: busca la tarea por su id; al final la devuelve con sus asignados
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t WHERE t.id = ?`, [id]);
  if (!rows[0]) return null;
  const [hydrated] = await hydrate(rows);
  return hydrated;
};

// Cómo se lee: "Exports punto findByUserId se asigna a async, pasando userId como parámetro."
// Qué es: la consulta que usa GET /api/users/:userId/tasks.
exports.findByUserId = async (userId) => { // Qué hace: filtra las tareas por la tabla intermedia task_users
  const [rows] = await pool.query(
    `SELECT ${TASK_FIELDS} FROM tasks t
       INNER JOIN task_users tu ON tu.task_id = t.id
      WHERE tu.user_id = ?
      ORDER BY t.id`,
    [userId]
  );
  return hydrate(rows);
};

// Cómo se lee: "Exports punto create se asigna a async, haciendo destructuring de title,
// description y assignedUsers."
// Qué es: el método que guarda la tarea Y sus asignaciones, todo en una transacción.
exports.create = async ({ title, description, assignedUsers }) => { // Qué hace: transacción = todo o nada: si falla la asignación, no queda la tarea a medias
  // Cómo se lee: "Const conn se asigna a await pool punto getConnection."
  const conn = await pool.getConnection(); // Qué es: agarra una conexión exclusiva de MySQL para este bloque
  // Cómo se lee: "Try: intenta la transacción."
  try { // Qué hace: intenta guardar todo
    // Cómo se lee: "Await conn punto beginTransaction."
    await conn.beginTransaction(); // Qué hace: inicia la transacción; todo se guarda junto o nada
    // Cómo se lee: "Const result se asigna a await conn punto query, con el INSERT en tasks con
    // estado Pendiente y NOW como fecha."
    const [result] = await conn.query(
      'INSERT INTO tasks (title, description, status, createdAt) VALUES (?, ?, ?, NOW())',
      [title, description || '', 'Pendiente']
    ); // Qué hace: guarda primero la tarea; MySQL genera su id
    // Cómo se lee: "TaskId se asigna a result punto insertId."
    const taskId = result.insertId; // Qué es: MySQL acaba de generar el id de la tarea
    // Cómo se lee: "If assignedUsers es un array y su longitud es mayor que 0."
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) { // Qué hace: solo entra si hay gente a quien asignar
      // Cómo se lee: "Await insertAssignments, pasando conexión, id y lista."
      // Qué es: el puente entre la tarea y sus destinatarios en task_users.
      await insertAssignments(conn, taskId, assignedUsers);
    }
    // Cómo se lee: "Await conn punto commit."
    await conn.commit(); // Qué hace: confirma la transacción: tarea y asignaciones quedan guardadas
    // Cómo se lee: "Return exports punto findById, pasando taskId."
    return exports.findById(taskId); // Qué hace: relee la tarea para devolverla con assignedUsers completo
  } catch (error) {
    // Cómo se lee: "Await conn punto rollback."
    await conn.rollback(); // Qué hace: si algo falló, deshace todo
    // Cómo se lee: "Throw error."
    throw error; // Qué hace: el error sube al controlador para responderlo
  } finally {
    // Cómo se lee: "Conn punto release."
    conn.release(); // Qué hace: suelta la conexión para que el pool la reutilice
  }
};

exports.update = async (id, { title, description, status }) => {
  const sets = [];
  const values = [];
  if (title !== undefined) { sets.push('title = ?'); values.push(title); }
  if (description !== undefined) { sets.push('description = ?'); values.push(description); }
  if (status !== undefined) { sets.push('status = ?'); values.push(status); }

  if (sets.length > 0) {
    values.push(id);
    await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, values);
  }
  return exports.findById(id);
};

exports.updateStatus = (id, status) => exports.update(id, { status });

exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// Cómo se lee: "Exports punto assignUsers se asigna a async, pasando taskId y entries como parámetros."
exports.assignUsers = async (taskId, entries) => { // Qué hace: asigna usuarios a una tarea que ya existía, con su propia transacción
  // Cómo se lee: "Const task se asigna a await exports punto findById, pasando taskId."
  const task = await exports.findById(taskId); // Qué hace: confirma que la tarea exista antes de asignar
  // Cómo se lee: "Si no task, return null."
  if (!task) return null; // Qué hace: si la tarea no existe, devuelve null
  // Cómo se lee: "Const conn se asigna a await pool punto getConnection."
  const conn = await pool.getConnection(); // Qué es: agarra una conexión exclusiva para la transacción
  try {
    // Cómo se lee: "Await conn punto beginTransaction."
    await conn.beginTransaction(); // Qué hace: inicia la transacción
    // Cómo se lee: "Await insertAssignments, pasando la conexión, id y entradas."
    await insertAssignments(conn, taskId, entries); // Qué hace: graba cada asignación en task_users
    // Cómo se lee: "Await conn commit."
    await conn.commit(); // Qué hace: confirma las asignaciones
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  // Cómo se lee: "Return exports findById taskId."
  return exports.findById(taskId); // Qué hace: devuelve la tarea ya con el nuevo asignado
};

// Cómo se lee: "Exports punto getAssignedUsers se asigna a async con taskId."
exports.getAssignedUsers = async (taskId) => { // Qué hace: devuelve los asignados de una sola tarea
  const task = await exports.findById(taskId);
  if (!task) return null;
  return task.assignedUsers;
};

// Cómo se lee: "RemoveUserAssignment: quita la asignación de un usuario a una tarea."
exports.removeUserAssignment = async (taskId, userId) => { // Qué hace: borra el vínculo en task_users y devuelve la tarea actualizada
  const task = await exports.findById(taskId);
  if (!task) return null;
  await pool.query(
    'DELETE FROM task_users WHERE task_id = ? AND user_id = ?',
    [taskId, userId]
  );
  return exports.findById(taskId);
};

exports.filter = async ({ status, userId, dateFrom, dateTo }) => {
  const where = [];
  const values = [];

  if (status) { where.push('t.status = ?'); values.push(status); }
  if (dateFrom) { where.push('t.createdAt >= ?'); values.push(new Date(dateFrom)); }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    where.push('t.createdAt <= ?');
    values.push(end);
  }

  let sql = `SELECT ${TASK_FIELDS} FROM tasks t`;
  if (userId) {
    sql += ' INNER JOIN task_users tu ON tu.task_id = t.id';
    where.push('tu.user_id = ?');
    values.push(userId);
  }
  if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY t.id';

  const [rows] = await pool.query(sql, values);
  return hydrate(rows);
};

exports.getDashboard = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM tasks');
  const [[{ completadas }]] = await pool.query(
    "SELECT COUNT(*) AS completadas FROM tasks WHERE status = 'Completada'"
  );
  const [[{ pendientes }]] = await pool.query(
    "SELECT COUNT(*) AS pendientes FROM tasks WHERE status = 'Pendiente'"
  );
  const [[{ enProgreso }]] = await pool.query(
    "SELECT COUNT(*) AS enProgreso FROM tasks WHERE status = 'En progreso'"
  );
  const [[{ totalUsuarios }]] = await pool.query('SELECT COUNT(*) AS totalUsuarios FROM users');
  const [porUsuario] = await pool.query(
    `SELECT tu.user_id AS userId, u.name AS userName, COUNT(*) AS count
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      GROUP BY tu.user_id, u.name
      ORDER BY u.name`
  );

  return {
    total,
    completadas,
    pendientes,
    enProgreso,
    porStatus: [
      { status: 'Pendiente', count: pendientes },
      { status: 'En progreso', count: enProgreso },
      { status: 'Completada', count: completadas }
    ],
    porUsuario,
    totalUsuarios
  };
};
