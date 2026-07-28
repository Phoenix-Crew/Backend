// ============================================================
// index.js (server) — Punto de entrada del backend Express
// ============================================================
// Monta los routers de auth, usuarios y tareas, expone el
// endpoint /api/dashboard y arranca el servidor en el puerto
// definido por PORT (por defecto 3002).
//
// [B3 - Brian] Configurar conexión a BD y variables de entorno
// ============================================================
// 1. Agregar dotenv y cargar config al inicio
// 2. Crear archivo .env con DB_HOST, DB_PORT, DB_USER, etc.
// 3. Agregar .env al .gitignore
// 4. Verificar conexión a BD antes de app.listen()
// 5. Si no hay BD, mostrar error y no iniciar servidor
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');

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

// GET /api/users/:userId/tasks — Tareas de un usuario especifico (filtra por userIds o userId)
app.get('/api/users/:userId/tasks', (req, res) => {
  const { readDB } = require('./models');
  const { tasks } = readDB();
  const userTasks = tasks.filter(t => {
    if (Array.isArray(t.userIds)) return t.userIds.includes(req.params.userId);
    return String(t.userId) === String(req.params.userId);
  });
  res.json(userTasks);
});

// GET /api — Health check basico de la API
app.get('/api', (req, res) => {
  res.json({ message: 'API REST - Gestión de Tareas v3.0', status: 'running' });
});

// Inicia el servidor en todas las interfaces de red
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
