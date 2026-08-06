const { pool } = require('../config/database');

const SAFE_FIELDS = 'id, name, email, rol, active, ficha';

function mapRow(row) {
  if (!row) return null;
  return { ...row, active: Boolean(row.active) };
}

function mapRows(rows) {
  return rows.map(mapRow);
}

exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users ORDER BY id`);
  return mapRows(rows);
};

exports.findById = async (id) => {
  const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`, [id]);
  return mapRow(rows[0]);
};

exports.findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return mapRow(rows[0]);
};

exports.create = async ({ name, email, rol, password, ficha }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, rol, password, active, ficha) VALUES (?, ?, ?, ?, TRUE, ?)',
    [name, email, rol, password, ficha || '3315656']
  );
  return exports.findById(result.insertId);
};

exports.update = async (id, { name, email, rol, password, ficha }) => {
  const sets = [];
  const values = [];
  if (name !== undefined) { sets.push('name = ?'); values.push(name); }
  if (email !== undefined) { sets.push('email = ?'); values.push(email); }
  if (rol !== undefined) { sets.push('rol = ?'); values.push(rol); }
  if (password !== undefined) { sets.push('password = ?'); values.push(password); }
  if (ficha !== undefined) { sets.push('ficha = ?'); values.push(ficha); }

  if (sets.length > 0) {
    values.push(id);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  }
  return exports.findById(id);
};

exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.updateActive = async (id, active) => {
  await pool.query('UPDATE users SET active = ? WHERE id = ?', [active, id]);
  return exports.findById(id);
};
