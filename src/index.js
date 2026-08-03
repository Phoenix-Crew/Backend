// ============================================================
// index.js (server) — Punto de entrada del backend Express
// ============================================================
// Monta los routers de auth, usuarios y tareas, expone el
// endpoint /api/dashboard y arranca el servidor en el puerto
// definido por PORT (por defecto 3002).
// El servidor solo inicia si la conexión a la BD es exitosa.

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/database');
const { runSeed } = require('./database/seed');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const taskController = require('./controllers/task.controller');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// GET /api/dashboard — Estadisticas globales (total, por estado, distribucion por usuario)
app.get('/api/dashboard', taskController.getDashboard);

// GET /api — Health check basico de la API
app.get('/api', (req, res) => {
  res.json({ message: 'API REST - Gestión de Tareas v3.0', status: 'running' });
});

// Verifica la conexión a la BD antes de arrancar el servidor.
// Crea las tablas si no existen y siembra datos de prueba la primera vez.
async function start() {
  try {
    await testConnection();
    const seeded = await runSeed();
    console.log('Conexión a la base de datos exitosa');
    console.log(seeded
      ? 'Datos de prueba sembrados (5 usuarios)'
      : 'Base de datos lista (usuarios ya existentes)');
  } catch (err) {
    console.error('ERROR: No se pudo conectar a la base de datos.');
    console.error('Revise las variables de entorno en .env y ejecute la primera vez src/database/init.sql');
    console.error(err.message);
    process.exit(1);
  }

  // Inicia el servidor en todas las interfaces de red
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

start();
