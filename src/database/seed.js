// ============================================================
// src/database/seed.js — Datos de prueba idempotentes
// ============================================================
// FLUJO DE EJECUCIÓN (2 formas):
//   1. Al arrancar: src/index.js → runSeed() (después de testConnection)
//   2. Manual: npm run seed → node src/database/seed.js (require.main)
//
// QUÉ HACE: asegura las tablas (initDatabase) e inserta 5 usuarios
// de prueba SOLO si la tabla users está vacía (idempotente)
// ============================================================

// Carga las variables del .env (necesarias para el pool al correr como script suelto)
require('dotenv').config();

// Importa el pool (conexión MySQL) y initDatabase (crea tablas si no existen)
// Vienen de: config/database.js
const { pool, initDatabase } = require('../config/database');

// Usuarios de prueba: estructura igual a la tabla users (sin id, sin active/ficha explícitos)
const SEED_USERS = [
  { name: 'Brian Bayona', email: 'brian@test.com', rol: 'Aprendiz', password: '123456' },
  { name: 'Nestor Gomez', email: 'nestor@test.com', rol: 'Aprendiz', password: '123456' },
  { name: 'Joser Fuentes', email: 'joser@test.com', rol: 'Aprendiz', password: '123456' },
  { name: 'Ana María López', email: 'ana@test.com', rol: 'Instrutora', password: '123456' },
  { name: 'Carlos Andrés Pérez', email: 'carlos@test.com', rol: 'Aprendiz', password: '123456' }
];

// ============================================================
// runSeed — Asegura las tablas y siembra usuarios si está vacío
// ORIGEN: src/index.js → start() (al arrancar el servidor)
// DESTINO: initDatabase (CREATE TABLE IF NOT EXISTS) + pool.query (INSERTs)
// QUÉ DEVUELVE: true si insertó datos, false si ya existían
// ============================================================
async function runSeed() {
  // Crea las 3 tablas si no existen (users, tasks, task_users)
  // Viene de: config/database.js → initDatabase()
  await initDatabase();

  // Cuenta cuántos usuarios hay: si ya hay datos, no vuelve a sembrar (idempotente)
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (count > 0) return false;

  // Inserta los 5 usuarios de prueba (INSERT por cada uno)
  // Destino: tabla users → el frontend los verá al cargar
  for (const u of SEED_USERS) {
    await pool.query(
      'INSERT INTO users (name, email, rol, password, active, ficha) VALUES (?, ?, ?, ?, TRUE, ?)',
      [u.name, u.email, u.rol, u.password, '3315656']
    );
  }
  return true;
}

// ============================================================
// Ejecución como script independiente (npm run seed)
// require.main === module: true solo si se ejecuta directamente
// (no cuando lo importa index.js)
// ============================================================
if (require.main === module) {
  (async () => {
    try {
      const seeded = await runSeed();
      console.log(seeded
        ? 'Seed completado: 5 usuarios de prueba insertados'
        : 'Seed omitido: la tabla users ya tiene datos');
    } catch (err) {
      console.error('Error en seed:', err.message);
      process.exitCode = 1;
    } finally {
      await pool.end(); // Cierra el pool: termina el proceso limpiamente
    }
  })();
}

// EXPORTA runSeed: lo consume src/index.js al arrancar
module.exports = { runSeed };
