// ============================================================
// scripts/setup-env.js — Crea .env desde .env.example si no existe
// ============================================================
// EJECUCIÓN: automática con npm install (script "postinstall" del package.json)
//
// FUNCIÓN: si el archivo .env no existe, copia .env.example → .env
// con las credenciales por defecto (grupo4/grupo4, BD gestion_tareas).
// Así en otra PC basta con `npm install` y la app ya tiene config.
//
// SEGURIDAD: NUNCA sobrescribe un .env existente (respeta configs locales).
// ============================================================

// Módulos nativos de Node: fs (copiar archivos), path (rutas)
const fs = require('fs');
const path = require('path');

// Rutas: raíz del proyecto, archivo plantilla y archivo destino
const root = path.join(__dirname, '..');
const source = path.join(root, '.env.example');
const target = path.join(root, '.env');

// Si el .env ya existe → no hace nada (el usuario ya lo configuró)
if (fs.existsSync(target)) {
  console.log('[setup-env] .env ya existe, no se modifica.');
} else {
  try {
    // Copia el contenido de la plantilla al .env (fs.copyFileSync)
    fs.copyFileSync(source, target);
    console.log('[setup-env] .env creado a partir de .env.example.');
  } catch (err) {
    // Si falla la copia (permisos, disco...), termina con error
    console.error('[setup-env] ERROR al crear .env:', err.message);
    process.exit(1);
  }
}
