// ============================================================
// scripts/db-init.js — Inicializa la base de datos (npm run db:init)
// ============================================================
// FUNCIÓN: ejecuta src/database/init.sql usando mysql2
// (sin depender del binario mysql del PATH → funciona en
// Git Bash, CMD y PowerShell de cualquier PC).
//
// FLUJO: npm run db:init → este script → obtiene credenciales admin
// → lee init.sql → conecta a MySQL → ejecuta cada sentencia
// → BD gestion_tareas + usuario grupo4 + tablas listos
//
// CREDENCIALES ADMIN (por orden de prioridad):
//   1. Argumentos:  node scripts/db-init.js --user=grupo4 --password=grupo4
//   2. Variables:   DB_ADMIN_USER / DB_ADMIN_PASSWORD (en .env o shell)
//   3. Interactivo: pide usuario y contraseña por consola
// ============================================================

// Módulos nativos de Node: fs (leer archivo), path (rutas), readline (consola)
const fs = require('fs');
const path = require('path');
const readline = require('readline');
// mysql2: mismo paquete que usa la app (ya está en package.json)
const mysql = require('mysql2/promise');

// Ubicación del script SQL (relativa a este archivo) y datos de conexión por defecto
const SQL_FILE = path.join(__dirname, '..', 'src', 'database', 'init.sql');
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3306;

// ============================================================
// parseArgs — Convierte los argumentos de la terminal en un objeto
// ORIGEN: process.argv (lo que se escribe tras `--`)
// Ejemplo: --user=grupo4 --password=grupo4 → { user: 'grupo4', password: 'grupo4' }
// ============================================================
function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

// ============================================================
// ask — Pide un valor por consola (con soporte de contraseña oculta)
// QUÉ HACE: si hidden es true, usa el modo raw de la terminal para
// mostrar asteriscos (***) en vez del texto. Si el entorno no lo
// soporta (stdin sin setRawMode), cae al modo pregunta normal.
// ============================================================
function ask(rl, query, hidden = false) {
  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(query, resolve);
      return;
    }
    const stdin = process.stdin;
    const stdout = process.stdout;
    const onData = (char) => {
      char = String(char);
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Enter o Ctrl+D: termina la entrada
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C: sale del programa
          stdin.removeListener('data', onData);
          stdout.write('\n');
          process.exit(130);
          break;
        default:
          input += char; // Acumula el carácter en la contraseña
          stdout.write('\x1b[2K\r' + query + '*'.repeat(input.length)); // Redibuja con asteriscos
      }
    };
    let input = '';
    stdin.setRawMode(true); // Modo raw: lee carácter por carácter sin Enter
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
    stdout.write(query);
  });
}

// ============================================================
// getCredentials — Obtiene las credenciales admin de MySQL
// ORIGEN: main() → DESTINO: mysql.createConnection
// ORDEN: argumentos → variables de entorno → prompt interactivo
// ============================================================
async function getCredentials(args) {
  const env = process.env;
  // 1. Prioridad máxima: argumentos de la terminal (--user= / --password=)
  if (args.user && args.password) {
    return { user: args.user, password: args.password };
  }
  // 2. Variables de entorno (definidas en .env o en la shell)
  if (env.DB_ADMIN_USER && env.DB_ADMIN_PASSWORD) {
    return { user: env.DB_ADMIN_USER, password: env.DB_ADMIN_PASSWORD };
  }
  // 3. Interactivo: pregunta por consola (usuario con valor por defecto y contraseña oculta)
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const user = await new Promise((resolve) =>
    rl.question(`Usuario admin de MySQL [${env.DB_ADMIN_USER || 'root'}]: `, (a) => resolve(a.trim() || env.DB_ADMIN_USER || 'root'))
  );
  const password = await ask(rl, 'Contraseña de MySQL: ', true);
  rl.close();
  return { user, password };
}

// ============================================================
// main — Secuencia principal del script
// FLUJO: parsea args → obtiene credenciales → lee init.sql
// → conecta a MySQL → ejecuta cada sentencia (con manejo del GRANT)
// → cierra conexión → mensaje final
// ============================================================
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const host = args.host || DEFAULT_HOST;
  const port = Number(args.port) || DEFAULT_PORT;
  const { user, password } = await getCredentials(args);

  // Lee init.sql y lo prepara:
  // 1. Quita las líneas de comentario (-- ...)
  // 2. Divide por ';' → array de sentencias individuales
  // 3. Elimina sentencias vacías
  const sql = fs.readFileSync(SQL_FILE, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  // Conecta a MySQL con las credenciales admin (aún no ejecuta SQL)
  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password, multipleStatements: false });
  } catch (err) {
    // Error de conexión: MySQL apagado o credenciales incorrectas
    console.error(`ERROR: No se pudo conectar a MySQL en ${host}:${port} como '${user}'.`);
    console.error(err.message);
    console.error('Verifique que MySQL esté corriendo y que las credenciales sean correctas.');
    process.exit(1);
  }

  console.log(`Conectado a MySQL (${host}:${port}) como '${user}'. Ejecutando init.sql...`);
  // Ejecuta las sentencias una por una
  for (const stmt of sql) {
    try {
      await connection.query(stmt);
    } catch (err) {
      // Caso especial del GRANT: si el usuario ya tiene los privilegios,
      // MySQL responde "Access denied" al re-grantearlos (no tiene GRANT OPTION).
      // Como el resultado deseado YA está cumplido, se omite con aviso.
      const isGrant = /^GRANT/i.test(stmt);
      const alreadyGranted = isGrant && /Access denied/i.test(err.message);
      if (alreadyGranted) {
        console.log(`Omitido (ya concedido): ${stmt.slice(0, 60)}...`);
      } else {
        throw err; // Cualquier otro error sí detiene el script
      }
    }
  }
  await connection.end();
  console.log('Base de datos lista: BD gestion_tareas, usuario grupo4 y tablas creadas/verificadas.');
}

// Punto de entrada: ejecuta main() y captura cualquier error no controlado
main().catch((err) => {
  console.error('ERROR durante la inicialización:', err.message);
  process.exit(1);
});
