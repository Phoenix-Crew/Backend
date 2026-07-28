// ============================================================
// models/index.js — Capa de persistencia en JSON (db.json)
// ============================================================
// readDB  →  lee y parsea db.json
// writeDB →  serializa y escribe db.json
// Ambas funciones operan sobre la ruta absoluta DB_PATH.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

// readDB — Lee y retorna el contenido completo de db.json como objeto JS
function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

// writeDB — Escribe el objeto data en db.json con formato indentado de 2 espacios
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readDB, writeDB };
