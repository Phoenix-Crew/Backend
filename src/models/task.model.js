import { readDB, writeDB } from "./database.js";

// =================================================================
// [B1 - Stiven] Migrar CADA método a consultas SQL con mysql2/pg
// =================================================================
// Cada método debe reemplazar readDB/writeDB por consultas SQL.
// Usar el pool de conexión de src/config/database.js (creado en B3).
// =================================================================

export const TaskModel = {
  // [B1] findAll() → SELECT * FROM tasks
  findAll() {
    const { tasks } = readDB();
    return tasks;
  },

  // [B1] findById(id) → SELECT * FROM tasks WHERE id = ?
  findById(id) {
    const { tasks } = readDB();
    return tasks.find((t) => t.id === id) || null;
  },

  // [B1] create(data) → INSERT INTO tasks (...) VALUES (...)
  // También INSERT INTO task_users para cada assignedUser
  create(data) {
    const db = readDB();
    const maxId = db.tasks.reduce((max, t) => Math.max(max, parseInt(t.id) || 0), 0);
    const newTask = {
      id: String(maxId + 1),
      title: data.title.trim(),
      description: (data.description || "").trim(),
      status: "Pendiente",
      createdAt: new Date().toLocaleString("es-CO"),
      assignedUsers: data.assignedUsers || [],
    };
    db.tasks.push(newTask);
    writeDB(db);
    return newTask;
  },

  // [B1] update(id, fields) → UPDATE tasks SET ... WHERE id = ?
  update(id, updatedFields) {
    const db = readDB();
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    db.tasks[idx] = { ...db.tasks[idx], ...updatedFields };
    writeDB(db);
    return db.tasks[idx];
  },

  // [B1] delete(id) → DELETE FROM tasks WHERE id = ?
  // También DELETE FROM task_users WHERE task_id = ?
  delete(id) {
    const db = readDB();
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    db.tasks.splice(idx, 1);
    writeDB(db);
    return true;
  },

  // [B1] filter(query) → SELECT * FROM tasks WHERE status=? AND ...
  filter(query = {}) {
    let { tasks } = readDB();
    const { status, userId, dateFrom, dateTo } = query;

    if (userId) {
      tasks = tasks.filter((task) =>
        task.assignedUsers &&
        task.assignedUsers.some((u) => String(u.id) === String(userId))
      );
    }
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      tasks = tasks.filter((t) => new Date(t.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      tasks = tasks.filter((t) => new Date(t.createdAt) <= to);
    }
    return tasks;
  },

  // [B1] getDashboard() → SELECT COUNT, GROUP BY status, JOIN task_users
  getDashboard() {
    const { tasks, users } = readDB();
    const total = tasks.length;
    const completadas = tasks.filter((t) => t.status === "Completada").length;
    const pendientes = tasks.filter((t) => t.status === "Pendiente").length;
    const enProgreso = tasks.filter((t) => t.status === "En progreso").length;

    const userMap = {};
    tasks.forEach((t) => {
      if (t.assignedUsers) {
        t.assignedUsers.forEach((u) => {
          const uid = String(u.id);
          if (!userMap[uid]) {
            userMap[uid] = { userId: uid, userName: u.name, count: 0 };
          }
          userMap[uid].count++;
        });
      }
    });

    return {
      total,
      completadas,
      pendientes,
      enProgreso,
      porStatus: [
        { status: "Pendiente", count: pendientes },
        { status: "En progreso", count: enProgreso },
        { status: "Completada", count: completadas },
      ],
      porUsuario: Object.values(userMap),
      totalUsuarios: users.length,
    };
  },

  // [B1] findByUserId(userId) → SELECT tasks.* FROM tasks
  // JOIN task_users ON tasks.id = task_users.task_id WHERE user_id = ?
  findByUserId(userId) {
    const { tasks } = readDB();
    return tasks.filter((t) => {
      if (Array.isArray(t.assignedUsers)) {
        return t.assignedUsers.some((u) => String(u.id) === String(userId));
      }
      if (Array.isArray(t.userIds)) {
        return t.userIds.includes(userId);
      }
      return String(t.userId) === String(userId);
    });
  },
};
