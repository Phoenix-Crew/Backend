require('dotenv').config();

const { pool, initDatabase } = require('../config/database');

const SEED_TASKS = [
  {
    title: 'Crear diagrama de base de datos',
    description: 'Modelar las tablas users, tasks y task_users en Draw.io',
    status: 'Pendiente',
    users: [1, 2]
  },
  {
    title: 'Diseñar el formulario de asignación de tareas',
    description: 'Maquetar el selector con los checkboxes de usuarios en el frontend',
    status: 'En progreso',
    users: [1]
  },
  {
    title: 'Documentar el flujo asignar tarea a usuario',
    description: 'Explicar palabra por palabra cómo funciona el flujo completo',
    status: 'Completada',
    users: [1, 3, 4]
  },
  {
    title: 'Crear API de tareas asignadas',
    description: 'Endpoint GET /api/users/:userId/tasks para cargar la tabla',
    status: 'Completada',
    users: [2]
  },
  {
    title: 'Probar asignación de varios usuarios',
    description: 'Registrar una tarea con 3 usuarios marcados y validar los badges',
    status: 'Pendiente',
    users: [2, 3, 5]
  },
  {
    title: 'Estilizar los badges de asignados',
    description: 'Ajustar el color y el tamaño del nombre de cada asignado en la fila',
    status: 'En progreso',
    users: [4]
  }
];

async function seedTasks() {
  await initDatabase();

  const existing = await pool.query(
    'SELECT id, name FROM users WHERE id > 0 ORDER BY id'
  );
  const users = existing[0];
  const usersById = Object.fromEntries(users.map((u) => [u.id, u.name]));
  if (users.length === 0) {
    console.log('No hay usuarios en la tabla users. Ejecuta primero: npm run seed');
    return false;
  }

  let created = 0;
  for (const t of SEED_TASKS) {
    const [rows] = await pool.query('SELECT id FROM tasks WHERE title = ?', [t.title]);
    if (rows.length > 0) {
      console.log(`Omitida (ya existe): ${t.title}`);
      continue;
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
      [t.title, t.description, t.status]
    );
    const taskId = result.insertId;

    for (const userId of t.users) {
      if (!usersById[userId]) continue;
      await pool.query(
        'INSERT IGNORE INTO task_users (task_id, user_id) VALUES (?, ?)',
        [taskId, userId]
      );
    }
    created++;
    console.log(`Creada: ${t.title} -> ids ${t.users.join(', ')}`);
  }

  return created > 0;
}

if (require.main === module) {
  (async () => {
    try {
      const created = await seedTasks();
      console.log(created
        ? 'Seed de tareas completado'
        : 'Seed de tareas omitido: sin tareas nuevas');
    } catch (err) {
      console.error('Error en seed de tareas:', err.message);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  })();
}

module.exports = { seedTasks };