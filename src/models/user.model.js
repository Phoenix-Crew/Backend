import { readDB, writeDB } from "./database.js";

// =================================================================
// [B1 - Stiven] Migrar CADA método a consultas SQL con mysql2/pg
// =================================================================

export const UserModel = {
  // [B1] findAll() → SELECT id, name, email, rol, active, ficha FROM users
  findAll() {
    const { users } = readDB();
    return users.map(({ password, ...u }) => u);
  },

  // [B1] findById(id) → SELECT ... FROM users WHERE id = ?
  findById(id) {
    const { users } = readDB();
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  // [B1] findByEmail(email) → SELECT * FROM users WHERE email = ?
  findByEmail(email) {
    const { users } = readDB();
    return users.find((u) => u.email === email) || null;
  },

  // [B1] create(data) → INSERT INTO users (...) VALUES (...)
  create(data) {
    const db = readDB();
    const maxId = db.users.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0);
    const newUser = {
      id: String(maxId + 1),
      name: data.name.trim(),
      email: data.email.trim(),
      rol: data.rol.trim(),
      password: data.password,
      active: true,
      ficha: data.ficha || "3315656",
    };
    db.users.push(newUser);
    writeDB(db);
    const { password, ...safeUser } = newUser;
    return safeUser;
  },

  // [B1] update(id, fields) → UPDATE users SET ... WHERE id = ?
  update(id, updatedFields) {
    const db = readDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updatedFields };
    writeDB(db);
    const { password, ...safeUser } = db.users[idx];
    return safeUser;
  },

  // [B1] delete(id) → DELETE FROM users WHERE id = ?
  delete(id) {
    const db = readDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    db.users.splice(idx, 1);
    writeDB(db);
    return true;
  },

  // [B1] toggleStatus(id, active) → UPDATE users SET active = ? WHERE id = ?
  toggleStatus(id, active) {
    const db = readDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx].active = active;
    writeDB(db);
    const { password, ...safeUser } = db.users[idx];
    return safeUser;
  },
};
