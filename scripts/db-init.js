// ============================================================
// scripts/db-init.js — Inicializa la base de datos (npm run db:init)
// ============================================================
// Ejecuta src/database/init.sql usando mysql2 (sin depender del
// binario mysql del PATH): crea la BD gestion_tareas, el usuario
// grupo4 y las tablas. Funciona en Git Bash, CMD y PowerShell.
//
// Credenciales admin (por orden):
//   1. Argumentos:  node scripts/db-init.js --user=root --password=xxx
//   2. Variables:   DB_ADMIN_USER / DB_ADMIN_PASSWORD (en .env o shell)
//   3. Interactivo: pide usuario y contraseña por consola

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

const SQL_FILE = path.join(__dirname, '..', 'src', 'database', 'init.sql');
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3306;

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

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
        case '\u0004':
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(input);
          break;
        case '\u0003':
          stdin.removeListener('data', onData);
          stdout.write('\n');
          process.exit(130);
          break;
        default:
          input += char;
          stdout.write('\x1b[2K\r' + query + '*'.repeat(input.length));
      }
    };
    let input = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
    stdout.write(query);
  });
}

async function getCredentials(args) {
  const env = process.env;
  if (args.user && args.password) {
    return { user: args.user, password: args.password };
  }
  if (env.DB_ADMIN_USER && env.DB_ADMIN_PASSWORD) {
    return { user: env.DB_ADMIN_USER, password: env.DB_ADMIN_PASSWORD };
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const user = await new Promise((resolve) =>
    rl.question(`Usuario admin de MySQL [${env.DB_ADMIN_USER || 'root'}]: `, (a) => resolve(a.trim() || env.DB_ADMIN_USER || 'root'))
  );
  const password = await ask(rl, 'Contraseña de MySQL: ', true);
  rl.close();
  return { user, password };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const host = args.host || DEFAULT_HOST;
  const port = Number(args.port) || DEFAULT_PORT;
  const { user, password } = await getCredentials(args);

  const sql = fs.readFileSync(SQL_FILE, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password, multipleStatements: false });
  } catch (err) {
    console.error(`ERROR: No se pudo conectar a MySQL en ${host}:${port} como '${user}'.`);
    console.error(err.message);
    console.error('Verifique que MySQL esté corriendo y que las credenciales sean correctas.');
    process.exit(1);
  }

  console.log(`Conectado a MySQL (${host}:${port}) como '${user}'. Ejecutando init.sql...`);
  for (const stmt of sql) {
    try {
      await connection.query(stmt);
    } catch (err) {
      const isGrant = /^GRANT/i.test(stmt);
      const alreadyGranted = isGrant && /Access denied/i.test(err.message);
      if (alreadyGranted) {
        console.log(`Omitido (ya concedido): ${stmt.slice(0, 60)}...`);
      } else {
        throw err;
      }
    }
  }
  await connection.end();
  console.log('Base de datos lista: BD gestion_tareas, usuario grupo4 y tablas creadas/verificadas.');
}

main().catch((err) => {
  console.error('ERROR durante la inicialización:', err.message);
  process.exit(1);
});
