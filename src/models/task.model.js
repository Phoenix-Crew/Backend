// ============================================================
// task.model.js — Capa de persistencia de tareas (MySQL)
// ============================================================
// Expone las operaciones CRUD sobre las tablas `tasks` y
// `task_users`, hidratando assignedUsers como [{ id, name }]
// mediante JOIN para mantener el contrato del frontend.

const { pool } = require('../config/database');

const TASK_FIELDS = 't.id, t.title, t.description, t.status, t.createdAt';

// insertAssignments — Inserta en task_users las asignaciones de una tarea
// (omite los usuarios que ya estaban asignados)
async function insertAssignments(conn, taskId, entries) {
  const list = Array.isArray(entries) ? entries : [entries];
  for (const entry of list) {
    if (!entry) continue;
    const userId = entry.id ?? entry.userId ?? entry;
    if (userId == null) continue;
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

// getAssignedUsersFor — Devuelve { taskId: [{ id, name }, ...] } para un set de tareas
async function getAssignedUsersFor(taskIds) {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT tu.task_id, u.id, u.name
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      WHERE tu.task_id IN (${placeholders})
      ORDER BY u.id`,
    taskIds
  );
  const map = {};
  rows.forEach((r) => {
    if (!map[r.task_id]) map[r.task_id] = [];
    map[r.task_id].push({ id: r.id, name: r.name });
  });
  return map;
}

// hydrate — Agrega a cada tarea su array assignedUsers
async function hydrate(tasks) {
  if (!tasks.length) return [];
  const map = await getAssignedUsersFor(tasks.map((t) => t.id));
  return tasks.map((t) => ({ ...t, assignedUsers: map[t.id] || [] }));
}

// findAll — Todas las tareas con sus usuarios asignados
exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t ORDER BY t.id`);
  return hydrate(rows);
};

// findById — Busca una tarea por id con sus usuarios asignados
exports.findById = async (id) => {
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t WHERE t.id = ?`, [id]);
  if (!rows[0]) return null;
  const [hydrated] = await hydrate(rows);
  return hydrated;
};

// findByUserId — Tareas asignadas a un usuario (JOIN con task_users)
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

// create — INSERT de tarea + sus asignaciones en una transacción
exports.create = async ({ title, description, assignedUsers }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO tasks (title, description, status, createdAt) VALUES (?, ?, ?, NOW())',
      [title, description || '', 'Pendiente']
    );
    const taskId = result.insertId;
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      await insertAssignments(conn, taskId, assignedUsers);
    }
    await conn.commit();
    return exports.findById(taskId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// update — UPDATE parcial de una tarea; retorna la tarea actualizada
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

// updateStatus — Cambia solo el estado de una tarea
exports.updateStatus = (id, status) => exports.update(id, { status });

// delete — DELETE de una tarea (cascade elimina sus filas en task_users)
exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// assignUsers — Asigna uno o más usuarios a una tarea (transacción); null si no existe
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

// getAssignedUsers — Usuarios asignados a una tarea; null si no existe la tarea
exports.getAssignedUsers = async (taskId) => {
  const task = await exports.findById(taskId);
  if (!task) return null;
  return task.assignedUsers;
};

// removeUserAssignment — Quita la asignación de un usuario a una tarea
exports.removeUserAssignment = async (taskId, userId) => {
  const task = await exports.findById(taskId);
  if (!task) return null;
  await pool.query(
    'DELETE FROM task_users WHERE task_id = ? AND user_id = ?',
    [taskId, userId]
  );
  return exports.findById(taskId);
};

// filter — Filtro combinado por status, userId y rango de fechas
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

// getDashboard — Estadísticas agregadas con SQL (total, por estado, por usuario)
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