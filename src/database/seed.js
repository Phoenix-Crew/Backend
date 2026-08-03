// ============================================================
// src/database/seed.js — Datos de prueba idempotentes
// ============================================================
// Inserta 5 usuarios de prueba SOLO si la tabla users está vacía.
// Puede ejecutarse como script (npm run seed) o llamarse desde
// index.js al arrancar (runSeed).

require('dotenv').config();

const { pool, initDatabase } = require('../config/database');

const SEED_USERS = [
  { name: 'Brian Bayona', email: 'brian@test.com', rol: 'Aprendiz', password: '123456' },
  { name: 'Nestor Gomez', email: 'nestor@test.com', rol: 'Aprendiz', password: '123456' },
  { name: 'Joser Fuentes', email: 'joser@test.com', rol: 'Aprendiz', password: '123456' },
  { name: 'Ana María López', email: 'ana@test.com', rol: 'Instrutora', password: '123456' },
  { name: 'Carlos Andrés Pérez', email: 'carlos@test.com', rol: 'Aprendiz', password: '123456' }
];

// runSeed — Asegura las tablas y siembra usuarios de prueba si la tabla está vacía.
// Devuelve true si insertó datos, false si ya existían.
async function runSeed() {
  await initDatabase();

  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (count > 0) return false;

  for (const u of SEED_USERS) {
    await pool.query(
      'INSERT INTO users (name, email, rol, password, active, ficha) VALUES (?, ?, ?, ?, TRUE, ?)',
      [u.name, u.email, u.rol, u.password, '3315656']
    );
  }
  return true;
}

// Si se ejecuta como script: node src/database/seed.js
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
      await pool.end();
    }
  })();
}

module.exports = { runSeed };
