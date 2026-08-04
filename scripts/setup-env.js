// ============================================================
// scripts/setup-env.js — Crea .env desde .env.example si no existe
// ============================================================
// Se ejecuta automáticamente con npm install (script postinstall).
// No sobrescribe un .env existente para respetar configuraciones locales.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, '.env.example');
const target = path.join(root, '.env');

if (fs.existsSync(target)) {
  console.log('[setup-env] .env ya existe, no se modifica.');
} else {
  try {
    fs.copyFileSync(source, target);
    console.log('[setup-env] .env creado a partir de .env.example.');
  } catch (err) {
    console.error('[setup-env] ERROR al crear .env:', err.message);
    process.exit(1);
  }
}
