// ============================================================
// src/config/database.js — Pool de conexión a MySQL
// ============================================================
// Lee las variables de entorno definidas en .env y crea un
// pool de conexiones reutilizable con mysql2/promise.
// Exporta la función testConnection() para verificar que
// el servidor solo arranca si la BD responde.

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_tareas',
  waitForConnections: true,
  connectionLimit: 10,
});

// testConnection — Ejecuta una query simple para validar la conexión
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
