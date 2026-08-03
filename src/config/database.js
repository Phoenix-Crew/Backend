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

// initDatabase — Crea las tablas si no existen (idempotente).
// Se ejecuta al iniciar el servidor para cumplir el criterio:
// "las tablas se crean automáticamente al iniciar".
async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      rol VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      ficha VARCHAR(50) DEFAULT '3315656'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('Pendiente', 'En progreso', 'Completada') DEFAULT 'Pendiente',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_users (
      task_id INT NOT NULL,
      user_id INT NOT NULL,
      PRIMARY KEY (task_id, user_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
}

module.exports = { pool, testConnection, initDatabase };
