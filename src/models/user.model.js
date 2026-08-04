// ============================================================
// user.model.js — Capa de persistencia de usuarios (MySQL)
// ============================================================
// FLUJO: user.controller.js llama a estas funciones
// → cada una ejecuta SQL con `pool` (config/database.js)
// → MySQL responde filas → se devuelven al controlador
//
// REGLA DE SEGURIDAD: las respuestas de listado/búsqueda
// NUNCA incluyen password (solo findByEmail lo trae, para login)
// ============================================================

// Importa el pool de conexiones MySQL (viene de config/database.js)
const { pool } = require('../config/database');

// Columnas seguras: se usan en los SELECT de listado/búsqueda (excluye password)
const SAFE_FIELDS = 'id, name, email, rol, active, ficha';

// ============================================================
// mapRow — Convierte 1 fila de MySQL a objeto JS con active booleano
// QUÉ HACE: MySQL devuelve active como 0/1 (TINYINT); el frontend
// espera true/false, así que se convierte con Boolean()
// ============================================================
function mapRow(row) {
  if (!row) return null;
  return { ...row, active: Boolean(row.active) };
}

// mapRows — Aplica mapRow a un array de filas (listados)
function mapRows(rows) {
  return rows.map(mapRow);
}

// ============================================================
// findAll — SELECT de todos los usuarios
// ORIGEN: user.controller.getAll → DESTINO: pool.query
// SQL: SELECT id, name, email, rol, active, ficha FROM users ORDER BY id
// ============================================================
exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users ORDER BY id`);
  return mapRows(rows);
};

// ============================================================
// findById — Busca un usuario por id
// ORIGEN: user.controller.getById / getUserTasks → DESTINO: pool.query
// SQL: SELECT ... WHERE id = ? (el ? evita inyección SQL)
// ============================================================
exports.findById = async (id) => {
  const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`, [id]);
  return mapRow(rows[0]);
};

// ============================================================
// findByEmail — Busca un usuario por email (INCLUYE password)
// ORIGEN: auth.controller.login (validar credenciales) y
//         user.controller.create (detectar email duplicado)
// SQL: SELECT * FROM users WHERE email = ?
// ============================================================
exports.findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return mapRow(rows[0]);
};

// ============================================================
// create — INSERT de un nuevo usuario
// ORIGEN: user.controller.create → DESTINO: pool.query
// SQL: INSERT INTO users (..., active, ficha) VALUES (..., TRUE, ?)
// QUÉ DEVUELVE: el usuario recién creado (relee con findById)
// ============================================================
exports.create = async ({ name, email, rol, password, ficha }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, rol, password, active, ficha) VALUES (?, ?, ?, ?, TRUE, ?)',
    [name, email, rol, password, ficha || '3315656'] // ficha por defecto: 3315656
  );
  return exports.findById(result.insertId); // result.insertId = id generado por AUTO_INCREMENT
};

// ============================================================
// update — UPDATE parcial de un usuario
// ORIGEN: user.controller.update → DESTINO: pool.query
// QUÉ HACE: arma el SET dinámicamente SOLO con los campos definidos
// (así el frontend puede enviar solo lo que cambió)
// QUÉ DEVUELVE: el usuario actualizado (relee con findById)
// ============================================================
exports.update = async (id, { name, email, rol, password, ficha }) => {
  const sets = [];
  const values = [];
  // Solo agrega al SET los campos que vinieron en el body (no undefined)
  if (name !== undefined) { sets.push('name = ?'); values.push(name); }
  if (email !== undefined) { sets.push('email = ?'); values.push(email); }
  if (rol !== undefined) { sets.push('rol = ?'); values.push(rol); }
  if (password !== undefined) { sets.push('password = ?'); values.push(password); }
  if (ficha !== undefined) { sets.push('ficha = ?'); values.push(ficha); }

  // Si hay al menos un campo que actualizar, ejecuta el UPDATE
  if (sets.length > 0) {
    values.push(id);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  }
  return exports.findById(id);
};

// ============================================================
// delete — DELETE de un usuario
// ORIGEN: user.controller.remove → DESTINO: pool.query
// QUÉ DEVUELVE: true si borró al menos 1 fila (affectedRows > 0)
// NOTA: la FK de task_users con ON DELETE CASCADE limpia sus asignaciones
// ============================================================
exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ============================================================
// updateActive — Activa o desactiva un usuario
// ORIGEN: user.controller.toggleStatus → DESTINO: pool.query
// SQL: UPDATE users SET active = ? WHERE id = ?
// QUÉ DEVUELVE: el usuario actualizado (relee con findById)
// ============================================================
exports.updateActive = async (id, active) => {
  await pool.query('UPDATE users SET active = ? WHERE id = ?', [active, id]);
  return exports.findById(id);
};
