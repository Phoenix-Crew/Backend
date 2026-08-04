// ============================================================
// src/config/database.js — Pool de conexión a MySQL
// ============================================================
// FLUJO: models (user.model.js / task.model.js) importan `pool`
// → pool.query(SQL) → MySQL → filas de vuelta al modelo.
// testConnection e initDatabase se usan al arrancar (index.js).
//
// Lee las credenciales del .env:
//   DB_HOST, DB_PORT, DB_USER=grupo4, DB_PASSWORD, DB_NAME=gestion_tareas
// ============================================================

// Importa mysql2 en modo promesas (permite await en las consultas)
// Dependencia de package.json: mysql2
const mysql = require('mysql2/promise');

// Crea el POOL de conexiones reutilizable (no se abre/cierra una por consulta)
// ORIGEN de las variables: .env (creado por scripts/setup-env.js en npm install)
// DESTINO: MySQL en DB_HOST:DB_PORT, base DB_NAME
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_tareas',
  waitForConnections: true, // Si no hay conexión libre, espera
  connectionLimit: 10,      // Máximo de conexiones simultáneas del pool
});

// ============================================================
// testConnection — Verifica que la BD responda
// QUIÉN LA LLAMA: src/index.js → start() antes de arrancar el servidor
// QUÉ HACE: toma una conexión del pool y ejecuta SELECT 1
// QUÉ DEVUELVE: nada; lanza error si MySQL no está disponible
// ============================================================
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1'); // Consulta trivial: la BD responde si llega aquí
  } finally {
    connection.release(); // Siempre devuelve la conexión al pool
  }
}

// ============================================================
// initDatabase — Crea las tablas si no existen (idempotente)
// QUIÉN LA LLAMA: src/database/seed.js → runSeed() (y por tanto index.js al arrancar)
// QUÉ HACE: ejecuta CREATE TABLE IF NOT EXISTS para users, tasks y task_users
// QUÉ DEVUELVE: nada
// NOTA: replica las tablas del init.sql para que el servidor sea autocontenido
// ============================================================
async function initDatabase() {
  // Tabla users: usuarios del sistema (id, nombre, email único, rol, password, activo, ficha)
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

  // Tabla tasks: tareas (id, título, descripción, estado, fecha de creación)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('Pendiente', 'En progreso', 'Completada') DEFAULT 'Pendiente',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla task_users: relación muchos-a-muchos entre tareas y usuarios
  // Un usuario puede tener muchas tareas; una tarea puede tener varios usuarios
  // Las FK con ON DELETE CASCADE borran las asignaciones si se borra la tarea/usuario
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

// EXPORTA: pool (lo usan los models), testConnection e initDatabase (las usa index.js/seed.js)
module.exports = { pool, testConnection, initDatabase };
