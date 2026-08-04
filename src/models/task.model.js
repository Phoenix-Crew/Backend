// ============================================================
// task.model.js — Capa de persistencia de tareas (MySQL)
// ============================================================
// FLUJO: task.controller.js llama a estas funciones
// → cada una ejecuta SQL con `pool` (config/database.js)
// → MySQL responde filas → se devuelven al controlador
//
// MODULARIZACIÓN INTERNA:
//   insertAssignments / getAssignedUsersFor / hydrate = helpers privados
//   findAll / findById / create / update / ... = funciones exportadas
//
// CONTRATO CON EL FRONTEND: cada tarea devuelta incluye
// assignedUsers: [{ id, name }] (rellenado con JOIN a task_users y users)
// ============================================================

// Importa el pool de conexiones MySQL (viene de config/database.js)
const { pool } = require('../config/database');

// Columnas de la tabla tasks con alias t (se usa en todos los SELECT)
const TASK_FIELDS = 't.id, t.title, t.description, t.status, t.createdAt';

// ============================================================
// insertAssignments (helper privado) — Inserta asignaciones en task_users
// ORIGEN: create() y assignUsers() (misma transacción)
// QUÉ HACE: por cada usuario { id } comprueba si ya está asignado
// y si no, hace INSERT INTO task_users (task_id, user_id)
// ============================================================
async function insertAssignments(conn, taskId, entries) {
  const list = Array.isArray(entries) ? entries : [entries];
  for (const entry of list) {
    if (!entry) continue;
    const userId = entry.id ?? entry.userId ?? entry; // acepta { id }, { userId } o el id directo
    if (userId == null) continue;
    // Evita duplicados: consulta si la asignación ya existe
    const [exists] = await conn.query(
      'SELECT 1 FROM task_users WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (exists.length === 0) {
      await conn.query(
        'INSERT INTO task_users (task_id, user_id) VALUES (?, ?)',
        [taskId, userId]
      );
    }
  }
}

// ============================================================
// getAssignedUsersFor (helper privado) — Usuarios asignados de varias tareas
// QUÉ HACE: recibe un array de task_id y hace UN solo SELECT con IN (...)
// SQL: SELECT tu.task_id, u.id, u.name FROM task_users tu
//      INNER JOIN users u ON u.id = tu.user_id WHERE tu.task_id IN (...)
// QUÉ DEVUELVE: { taskId: [{ id, name }, ...] } agrupado por tarea
// ============================================================
async function getAssignedUsersFor(taskIds) {
  if (taskIds.length === 0) return {};
  // Crea los placeholders ? ? ? según cuántas tareas haya (evita inyección SQL)
  const placeholders = taskIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT tu.task_id, u.id, u.name
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      WHERE tu.task_id IN (${placeholders})
      ORDER BY u.id`,
    taskIds
  );
  // Agrupa las filas por task_id → { 1: [{id,name}], 2: [...] }
  const map = {};
  rows.forEach((r) => {
    if (!map[r.task_id]) map[r.task_id] = [];
    map[r.task_id].push({ id: r.id, name: r.name });
  });
  return map;
}

// ============================================================
// hydrate (helper privado) — Agrega assignedUsers a cada tarea
// ORIGEN: todas las funciones que devuelven tareas (findAll, findById, ...)
// QUÉ HACE: junta las tareas con sus asignados en UNA consulta eficiente
// QUÉ DEVUELVE: el array de tareas con la propiedad assignedUsers
// ============================================================
async function hydrate(tasks) {
  if (!tasks.length) return [];
  const map = await getAssignedUsersFor(tasks.map((t) => t.id));
  return tasks.map((t) => ({ ...t, assignedUsers: map[t.id] || [] }));
}

// ============================================================
// findAll — Todas las tareas con sus usuarios asignados
// ORIGEN: task.controller.getAll → DESTINO: pool.query + hydrate
// ============================================================
exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t ORDER BY t.id`);
  return hydrate(rows);
};

// ============================================================
// findById — Busca una tarea por id con sus asignados
// ORIGEN: task.controller.getById / getAssignedUsers / assignUsers ...
// QUÉ DEVUELVE: la tarea hidratada o null si no existe
// ============================================================
exports.findById = async (id) => {
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t WHERE t.id = ?`, [id]);
  if (!rows[0]) return null;
  const [hydrated] = await hydrate(rows);
  return hydrated;
};

// ============================================================
// findByUserId — Tareas asignadas a un usuario
// ORIGEN: user.controller.getUserTasks (GET /api/users/:userId/tasks)
// SQL: SELECT tasks INNER JOIN task_users WHERE tu.user_id = ?
// ============================================================
exports.findByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT ${TASK_FIELDS} FROM tasks t
       INNER JOIN task_users tu ON tu.task_id = t.id
      WHERE tu.user_id = ?
      ORDER BY t.id`,
    [userId]
  );
  return hydrate(rows);
};

// ============================================================
// create — INSERT de tarea + asignaciones en UNA transacción
// ORIGEN: task.controller.create → DESTINO: conn (transacción)
// FLUJO: beginTransaction → INSERT tarea → insertAssignments
// → commit (si todo OK) o rollback (si algo falla) → devuelve la tarea creada
// POR QUÉ TRANSACCIÓN: si falla una asignación, no queda la tarea a medias
// ============================================================
exports.create = async ({ title, description, assignedUsers }) => {
  const conn = await pool.getConnection(); // Toma una conexión exclusiva del pool
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO tasks (title, description, status, createdAt) VALUES (?, ?, ?, NOW())',
      [title, description || '', 'Pendiente'] // Estado inicial: Pendiente
    );
    const taskId = result.insertId;
    // Inserta las asignaciones solo si vinieron usuarios
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      await insertAssignments(conn, taskId, assignedUsers);
    }
    await conn.commit(); // Confirma todo
    return exports.findById(taskId);
  } catch (error) {
    await conn.rollback(); // Deshace todo si hubo error
    throw error;
  } finally {
    conn.release(); // Devuelve la conexión al pool
  }
};

// ============================================================
// update — UPDATE parcial de una tarea
// ORIGEN: task.controller.update → DESTINO: pool.query
// QUÉ HACE: arma el SET solo con title/description/status definidos
// QUÉ DEVUELVE: la tarea actualizada (relee con findById)
// ============================================================
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

// ============================================================
// updateStatus — Cambia solo el estado
// ORIGEN: task.controller.updateStatus → DESTINO: update (reutilización)
// QUÉ HACE: delega en update() pasando solo { status }
// ============================================================
exports.updateStatus = (id, status) => exports.update(id, { status });

// ============================================================
// delete — DELETE de una tarea
// ORIGEN: task.controller.remove → DESTINO: pool.query
// NOTA: la FK de task_users con ON DELETE CASCADE limpia sus asignaciones
// QUÉ DEVUELVE: true si borró al menos 1 fila
// ============================================================
exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ============================================================
// assignUsers — Asigna uno o más usuarios a una tarea (transacción)
// ORIGEN: task.controller.assignUsers → DESTINO: conn (transacción)
// QUÉ DEVUELVE: la tarea actualizada, o null si la tarea no existe
// ============================================================
exports.assignUsers = async (taskId, entries) => {
  const task = await exports.findById(taskId);
  if (!task) return null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await insertAssignments(conn, taskId, entries);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return exports.findById(taskId);
};

// ============================================================
// getAssignedUsers — Usuarios asignados a una tarea
// ORIGEN: task.controller.getAssignedUsers / assignUsers (verificación)
// QUÉ DEVUELVE: array [{ id, name }] o null si la tarea no existe
// ============================================================
exports.getAssignedUsers = async (taskId) => {
  const task = await exports.findById(taskId);
  if (!task) return null;
  return task.assignedUsers;
};

// ============================================================
// removeUserAssignment — Quita la asignación de un usuario
// ORIGEN: task.controller.removeUserAssignment → DESTINO: pool.query
// SQL: DELETE FROM task_users WHERE task_id = ? AND user_id = ?
// ============================================================
exports.removeUserAssignment = async (taskId, userId) => {
  const task = await exports.findById(taskId);
  if (!task) return null;
  await pool.query(
    'DELETE FROM task_users WHERE task_id = ? AND user_id = ?',
    [taskId, userId]
  );
  return exports.findById(taskId);
};

// ============================================================
// filter — Filtro combinado (panel admin del frontend)
// ORIGEN: task.controller.filter → DESTINO: pool.query
// PARÁMETROS (query string): status, userId, dateFrom, dateTo
// QUÉ HACE: arma el WHERE dinámicamente según los parámetros presentes.
// Si viene userId, agrega un INNER JOIN con task_users.
// dateTo se ajusta al final del día (23:59:59) para incluir el día completo
// ============================================================
exports.filter = async ({ status, userId, dateFrom, dateTo }) => {
  const where = [];
  const values = [];

  // Cada filtro presente agrega su condición al WHERE
  if (status) { where.push('t.status = ?'); values.push(status); }
  if (dateFrom) { where.push('t.createdAt >= ?'); values.push(new Date(dateFrom)); }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999); // Incluye todo el día seleccionado
    where.push('t.createdAt <= ?');
    values.push(end);
  }

  // Construye la consulta base (con JOIN si se filtra por usuario)
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

// ============================================================
// getDashboard — Estadísticas agregadas (GET /api/dashboard)
// ORIGEN: src/index.js → task.controller.getDashboard
// QUÉ HACE: varias consultas con funciones agregadas SQL:
//   COUNT(*) total y por cada estado + COUNT de usuarios + GROUP BY por usuario
// QUÉ DEVUELVE: { total, completadas, pendientes, enProgreso,
//                porStatus: [...], porUsuario: [...], totalUsuarios }
// QUIÉN LO CONSUME: frontend tareasService.loadAdminPanel → fetchDashboard
// ============================================================
exports.getDashboard = async () => {
  // Total de tareas
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM tasks');
  // Tareas completadas (status = 'Completada')
  const [[{ completadas }]] = await pool.query(
    "SELECT COUNT(*) AS completadas FROM tasks WHERE status = 'Completada'"
  );
  // Tareas pendientes
  const [[{ pendientes }]] = await pool.query(
    "SELECT COUNT(*) AS pendientes FROM tasks WHERE status = 'Pendiente'"
  );
  // Tareas en progreso
  const [[{ enProgreso }]] = await pool.query(
    "SELECT COUNT(*) AS enProgreso FROM tasks WHERE status = 'En progreso'"
  );
  // Total de usuarios registrados
  const [[{ totalUsuarios }]] = await pool.query('SELECT COUNT(*) AS totalUsuarios FROM users');
  // Distribución por usuario: cuántas tareas tiene cada uno (JOIN + GROUP BY)
  const [porUsuario] = await pool.query(
    `SELECT tu.user_id AS userId, u.name AS userName, COUNT(*) AS count
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      GROUP BY tu.user_id, u.name
      ORDER BY u.name`
  );

  // Arma el objeto de respuesta con la estructura que espera el frontend
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
