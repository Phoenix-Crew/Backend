// ============================================================
// models/index.js — Punto de entrada de los modelos con BD
// ============================================================
// Exporta UserModel y TaskModel (capa de persistencia MySQL).
// Reemplaza el antiguo readDB/writeDB basado en db.json.

const UserModel = require('./user.model');
const TaskModel = require('./task.model');

module.exports = { UserModel, TaskModel };