import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

export function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

export function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// =================================================================
// [B1 - Stiven] Reemplazar este archivo con conexión a BD real
// =================================================================
// Crear src/config/database.js con mysql2/pg connection pool.
// Luego este archivo debe usar la BD en vez de db.json.
// Ver init.sql como guía de estructura de tablas.
// =================================================================
