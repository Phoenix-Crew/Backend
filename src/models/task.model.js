const { pool } = require('../config/database');

const TASK_FIELDS = 't.id, t.title, t.description, t.status, t.createdAt'; // "const" declara; "TASK_FIELDS" es una constante con la lista de columnas de la tabla "tasks" que se devuelven al frontend; "'t."' indica que cada columna viene con su alias "t" de tabla

async function insertAssignments(conn, taskId, entries) { // "async" permite usar "await"; "function" declara la función; "insertAssignments" inserta la asignación de usuarios a una tarea; "conn" es la conexión de la transacción, "taskId" la tarea y "entries" la lista de usuarios a asignar; la llave abre el bloque
  const list = Array.isArray(entries) ? entries : [entries]; // "const" declara; "list" guardará la lista de usuarios; "Array.isArray" pregunta si "entries" ya es un array; el "?" significa "si lo es, usa entries"; el ":" significa "si no lo es, envuélvelo en [entries]" para normalizar cuando llega un solo usuario
  for (const entry of list) { // "for" inicia un ciclo; "of" recorre cada elemento; "entry" es el usuario de esta vuelta; "list" es la lista de usuarios a asignar; la llave abre el ciclo
    if (!entry) continue; // "if" pregunta si "entry" está vacío; "continue" salta a la siguiente vuelta del ciclo sin hacer nada, omitiendo entradas vacías
    const userId = entry.id ?? entry.userId ?? entry; // "const" declara; "userId" guarda el id; "??" es el operador "o si es null": intenta "entry.id", si no existe prueba "entry.userId", y si tampoco, usa "entry" directamente; acepta los tres formatos { id }, { userId } o id suelto
    if (userId == null) continue; // "if" pregunta si "userId" es null; "continue" salta esta vuelta: se omite si la entrada no trae un id válido
    const [exists] = await conn.query( // "const" declara; las llaves extraen el primer valor del resultado en "exists"; "await" espera; "conn.query" ejecuta una consulta sobre la conexión de la transacción; el paréntesis abre los argumentos
      'SELECT 1 FROM task_users WHERE task_id = ? AND user_id = ?', // primer argumento: la consulta SQL que pregunta si ya existe una fila en "task_users" para ese "task_id" y ese "user_id"; los "?" son marcadores de posición
      [taskId, userId] // segundo argumento: el array con los valores reales de "taskId" y "userId" que reemplazan a los "?" de forma segura
    ); // el paréntesis cierra la llamada a "query"
    if (exists.length === 0) { // "if" pregunta si la consulta no devolvió filas ("length === 0"), es decir que el usuario NO está asignado aún
      await conn.query( // "await" espera; "conn.query" ejecuta la inserción sobre la conexión de la transacción
        'INSERT INTO task_users (task_id, user_id) VALUES (?, ?)', // la consulta SQL inserta una fila en "task_users" con el id de la tarea y el id del usuario: así queda guardada la asignación
        [taskId, userId] // los valores reales de "taskId" y "userId" que reemplazan a los "?"
      ); // cierra la llamada a "query"
    } // la llave cierra el "if"
  } // la llave cierra el ciclo "for"
} // la llave cierra la función

async function getAssignedUsersFor(taskIds) { // "async" permite "await"; "function" declara; "getAssignedUsersFor" consulta los usuarios asignados de varias tareas a la vez; "taskIds" es el array con los ids de las tareas; la llave abre el bloque
  if (taskIds.length === 0) return {}; // "if" pregunta si la lista de tareas está vacía; "return {}" devuelve un objeto vacío: sin tareas no hay asignaciones que consultar
  const placeholders = taskIds.map(() => '?').join(', '); // "const" declara; "placeholders" guarda los marcadores; "taskIds.map" crea un '?' por cada tarea; ".join(', ')" los une con comas: si son dos tareas queda "?, ?"; esto evita la inyección SQL
  const [rows] = await pool.query( // "const" declara; las llaves extraen el resultado en "rows"; "await" espera; "pool.query" ejecuta la consulta sobre el pool de conexiones; el paréntesis abre los argumentos
    `SELECT tu.task_id, u.id, u.name
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      WHERE tu.task_id IN (${placeholders})
      ORDER BY u.id`, // la consulta SQL une "task_users" (alias "tu") con "users" (alias "u") con "INNER JOIN"; "ON u.id = tu.user_id" enlaza el usuario con la asignación; "WHERE tu.task_id IN (...)" filtra solo las tareas pedidas y los "placeholders" son los "?"; "ORDER BY u.id" ordena por id de usuario; la consulta trae el nombre de cada usuario asignado
    taskIds // el array con los ids reales de las tareas que reemplazan a los "?"
  ); // el paréntesis cierra la llamada a "query"
  const map = {}; // "const" declara; "map" es un objeto que agrupará las filas por "task_id": cada tarea tendrá su lista de usuarios
  rows.forEach((r) => { // "rows.forEach" recorre cada fila devuelta; "r" es la fila actual; "=>" abre la función anónima
    if (!map[r.task_id]) map[r.task_id] = []; // "if" pregunta si la tarea aún no tiene lista en el "map"; si no tiene, "map[r.task_id]" se inicializa como un array vacío
    map[r.task_id].push({ id: r.id, name: r.name }); // "map[r.task_id]" es la lista de esa tarea; ".push" agrega; las llaves crean el objeto con "id" y "name" del usuario asignado
  }); // la llave cierra el "forEach" y el paréntesis cierra la llamada
  return map; // "return" devuelve el "map": objeto donde cada key es un "task_id" y su valor es el array de usuarios asignados
} // la llave cierra la función

async function hydrate(tasks) { // "async" permite "await"; "function" declara; "hydrate" agrega la propiedad "assignedUsers" a cada tarea; "tasks" recibe el array de tareas de la base de datos; la llave abre el bloque
  if (!tasks.length) return []; // "if" pregunta si la lista de tareas está vacía; "return []" devuelve un array vacío: sin tareas no hay nada que hidratar
  const map = await getAssignedUsersFor(tasks.map((t) => t.id)); // "const" declara; "map" guarda el resultado; "await" espera; "getAssignedUsersFor" consulta los asignados; "tasks.map" recorre las tareas y "t" es cada una; "(t) => t.id" extrae el id de cada tarea, formando el array de ids
  return tasks.map((t) => ({ ...t, assignedUsers: map[t.id] || [] })); // "return" devuelve; "tasks.map" recorre cada tarea; "(t)" es cada tarea; las llaves crean el objeto final: "...t" copia todas las propiedades originales de la tarea y "assignedUsers" agrega la lista de asignados, usando "map[t.id]" o un array vacío si la tarea no tiene ninguno
} // la llave cierra la función

exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t ORDER BY t.id`);
  return hydrate(rows);
};

exports.findById = async (id) => { // "exports.findById" exporta la función "findById"; "async" permite "await"; "id" recibe el id de la tarea a buscar; la llave abre el bloque: busca la tarea por su id y trae sus usuarios asignados
  const [rows] = await pool.query(`SELECT ${TASK_FIELDS} FROM tasks t WHERE t.id = ?`, [id]); // "const" declara; las llaves extraen el resultado en "rows"; "await" espera; "pool.query" ejecuta la consulta; el SQL usa "TASK_FIELDS" (las columnas con alias "t") desde la tabla "tasks t" con "WHERE t.id = ?"; "id" reemplaza el "?"; es la búsqueda por id
  if (!rows[0]) return null; // "if" pregunta si no vino ninguna fila ("!rows[0]"), es decir que la tarea no existe; "return null" devuelve null para que el controlador responda con 404
  const [hydrated] = await hydrate(rows); // "const" declara; las llaves extraen la primera tarea en "hydrated"; "await" espera; "hydrate(rows)" agrega la propiedad "assignedUsers" a la tarea encontrada
  return hydrated; // "return" devuelve; "hydrated" es la tarea completa con su array de usuarios asignados
};

exports.findByUserId = async (userId) => { // "exports.findByUserId" exporta la función "findByUserId"; "async" permite "await"; "userId" es el id del usuario; la llave abre el bloque: devuelve las tareas asignadas a un usuario
  const [rows] = await pool.query( // "const" declara; las llaves extraen el resultado en "rows"; "await" espera; "pool.query" ejecuta la consulta; el paréntesis abre los argumentos
    `SELECT ${TASK_FIELDS} FROM tasks t
       INNER JOIN task_users tu ON tu.task_id = t.id
      WHERE tu.user_id = ?
      ORDER BY t.id`, // la consulta SQL une "tasks" (alias "t") con "task_users" (alias "tu") con "INNER JOIN"; "ON tu.task_id = t.id" enlaza cada tarea con su asignación; "WHERE tu.user_id = ?" filtra solo las tareas asignadas al usuario; "ORDER BY t.id" las ordena; el "?" es el marcador
    [userId] // el id real del usuario que reemplaza al "?"
  ); // el paréntesis cierra la llamada a "query"
  return hydrate(rows); // "return" devuelve; "hydrate(rows)" agrega la propiedad "assignedUsers" a cada tarea antes de enviarla
};

exports.create = async ({ title, description, assignedUsers }) => { // "exports.create" exporta la función "create"; "async" permite "await"; las llaves desestructuran el objeto recibido en "title", "description" y "assignedUsers"; la llave abre el bloque: crea la tarea y sus asignaciones en una transacción
  const conn = await pool.getConnection(); // "const" declara; "conn" es la conexión; "await" espera; "pool.getConnection()" toma una conexión exclusiva del pool para manejar la transacción de principio a fin
  try { // "try" abre el bloque protegido
    await conn.beginTransaction(); // "await" espera; "conn.beginTransaction()" inicia la transacción: todo lo que se haga ahora se confirmará o se deshará junto
    const [result] = await conn.query( // "const" declara; las llaves extraen el resultado en "result"; "await" espera; "conn.query" ejecuta la inserción sobre la conexión de la transacción
      'INSERT INTO tasks (title, description, status, createdAt) VALUES (?, ?, ?, NOW())', // la consulta SQL inserta la tarea con título, descripción, estado y la fecha actual; "NOW()" genera la fecha y hora actuales en MySQL
      [title, description || '', 'Pendiente'] // los valores que reemplazan a los "?": el título, la descripción (o texto vacío si no viene) y el estado "Pendiente", porque la nueva tarea siempre empieza pendiente
    ); // el paréntesis cierra la llamada a "query"
    const taskId = result.insertId; // "const" declara; "taskId" guarda el id; "result.insertId" es el id que MySQL generó para la tarea recién insertada
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) { // "if" pregunta dos cosas con "&&" (y): "Array.isArray(assignedUsers)" si es un array y "assignedUsers.length > 0" si tiene al menos un usuario; si el frontend envió usuarios a asignar, entra al bloque
      await insertAssignments(conn, taskId, assignedUsers); // "await" espera; "insertAssignments" inserta en "task_users" cada asignación; "conn" es la conexión de la transacción, "taskId" la tarea creada y "assignedUsers" la lista de usuarios
    } // la llave cierra el "if"
    await conn.commit(); // "await" espera; "conn.commit()" confirma la transacción: la tarea y sus asignaciones quedan guardadas juntas
    return exports.findById(taskId); // "return" devuelve; "exports.findById(taskId)" relee la tarea para devolverla con su propiedad "assignedUsers" llena
  } catch (error) { // "catch" atrapa cualquier error; "error" es ese error
    await conn.rollback(); // "await" espera; "conn.rollback()" deshace todo lo que se hizo en la transacción: si algo falla, no queda la tarea a medias ni asignaciones sueltas
    throw error; // "throw" relanza; "error" para que el controlador lo capture y responda el error 500
  } finally { // "finally" se ejecuta siempre, con éxito o con error
    conn.release(); // "conn.release()" devuelve la conexión al pool para que otro proceso la pueda usar
  } // la llave cierra el "finally"
};

exports.update = async (id, { title, description, status }) => {
  const sets = [];
  const values = [];
  if (title !== undefined) { sets.push('title = ?'); values.push(title); }
  if (description !== undefined) { sets.push('description = ?'); values.push(description); }
  if (status !== undefined) { sets.push('status = ?'); values.push(status); }

  if (sets.length > 0) {
    values.push(id);
    await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, values);
  }
  return exports.findById(id);
};

exports.updateStatus = (id, status) => exports.update(id, { status });

exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.assignUsers = async (taskId, entries) => { // "exports.assignUsers" exporta la función "assignUsers"; "async" permite "await"; "taskId" es la tarea y "entries" la lista de usuarios a asignar; la llave abre el bloque: asigna uno o más usuarios a una tarea ya existente
  const task = await exports.findById(taskId); // "const" declara; "task" guarda el resultado; "await" espera; "exports.findById(taskId)" verifica que la tarea exista y trae sus asignados actuales
  if (!task) return null; // "if" pregunta si la tarea no existe; "return null" devuelve null para que el controlador responda 404
  const conn = await pool.getConnection(); // "const" declara; "conn" es la conexión; "await" espera; "pool.getConnection()" toma una conexión exclusiva para la transacción
  try { // "try" abre el bloque protegido
    await conn.beginTransaction(); // "await" espera; "conn.beginTransaction()" inicia la transacción
    await insertAssignments(conn, taskId, entries); // "await" espera; "insertAssignments" inserta las nuevas asignaciones en "task_users" sobre la conexión de la transacción, verificando que no existan ya
    await conn.commit(); // "await" espera; "conn.commit()" confirma las asignaciones
  } catch (error) { // "catch" atrapa el error
    await conn.rollback(); // "conn.rollback()" deshace la transacción si algo falló
    throw error; // "throw" relanza el error
  } finally { // "finally" se ejecuta siempre
    conn.release(); // "conn.release()" devuelve la conexión al pool
  } // la llave cierra el "finally"
  return exports.findById(taskId); // "return" devuelve; "exports.findById(taskId)" relee la tarea para entregarla con sus asignados actualizados
};

exports.getAssignedUsers = async (taskId) => { // "exports.getAssignedUsers" exporta la función "getAssignedUsers"; "async" permite "await"; "taskId" es la tarea; la llave abre el bloque: devuelve los usuarios asignados a una tarea
  const task = await exports.findById(taskId); // "const" declara; "task" guarda el resultado; "await" espera; "exports.findById" reutiliza la búsqueda que ya valida si la tarea existe y trae su propiedad "assignedUsers"
  if (!task) return null; // "if" pregunta si la tarea no existe; "return null" devuelve null para el 404
  return task.assignedUsers; // "return" devuelve; "task.assignedUsers" es el array de objetos [{ id, name }] con los usuarios asignados a la tarea
};

exports.removeUserAssignment = async (taskId, userId) => { // "exports.removeUserAssignment" exporta la función "removeUserAssignment"; "async" permite "await"; "taskId" es la tarea y "userId" el usuario a desasignar; la llave abre el bloque: quita la asignación de un usuario a una tarea
  const task = await exports.findById(taskId); // "const" declara; "task" guarda el resultado; "await" espera; "exports.findById(taskId)" verifica que la tarea exista
  if (!task) return null; // "if" pregunta si la tarea no existe; "return null" devuelve null para el 404
  await pool.query( // "await" espera; "pool.query" ejecuta el borrado sobre el pool de conexiones
    'DELETE FROM task_users WHERE task_id = ? AND user_id = ?', // la consulta SQL borra la fila de "task_users" que une la tarea con el usuario: así se elimina la asignación
    [taskId, userId] // los valores reales de "taskId" y "userId" que reemplazan a los "?"
  ); // el paréntesis cierra la llamada a "query"
  return exports.findById(taskId); // "return" devuelve; "exports.findById(taskId)" relee la tarea ya sin ese usuario en "assignedUsers"
};

exports.filter = async ({ status, userId, dateFrom, dateTo }) => {
  const where = [];
  const values = [];

  if (status) { where.push('t.status = ?'); values.push(status); }
  if (dateFrom) { where.push('t.createdAt >= ?'); values.push(new Date(dateFrom)); }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    where.push('t.createdAt <= ?');
    values.push(end);
  }

  let sql = `SELECT ${TASK_FIELDS} FROM tasks t`;
  if (userId) {
    sql += ' INNER JOIN task_users tu ON tu.task_id = t.id';
    where.push('tu.user_id = ?');
    values.push(userId);
  }
  if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY t.id';

  const [rows] = await pool.query(sql, values);
  return hydrate(rows);
};

exports.getDashboard = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM tasks');
  const [[{ completadas }]] = await pool.query(
    "SELECT COUNT(*) AS completadas FROM tasks WHERE status = 'Completada'"
  );
  const [[{ pendientes }]] = await pool.query(
    "SELECT COUNT(*) AS pendientes FROM tasks WHERE status = 'Pendiente'"
  );
  const [[{ enProgreso }]] = await pool.query(
    "SELECT COUNT(*) AS enProgreso FROM tasks WHERE status = 'En progreso'"
  );
  const [[{ totalUsuarios }]] = await pool.query('SELECT COUNT(*) AS totalUsuarios FROM users');
  const [porUsuario] = await pool.query(
    `SELECT tu.user_id AS userId, u.name AS userName, COUNT(*) AS count
       FROM task_users tu
       INNER JOIN users u ON u.id = tu.user_id
      GROUP BY tu.user_id, u.name
      ORDER BY u.name`
  );

  return {
    total,
    completadas,
    pendientes,
    enProgreso,
    porStatus: [
      { status: 'Pendiente', count: pendientes },
      { status: 'En progreso', count: enProgreso },
      { status: 'Completada', count: completadas }
    ],
    porUsuario,
    totalUsuarios
  };
};
