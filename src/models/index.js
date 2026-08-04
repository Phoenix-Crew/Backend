// ============================================================
// models/index.js — Punto de entrada de los modelos con BD
// ============================================================
// FUNCIÓN: "barril" (barrel) — centraliza los modelos para
// importarlos con una sola línea desde cualquier archivo.
//
// ORIGEN de los modelos: user.model.js y task.model.js
// DESTINO: los importan los controllers
//   controllers/auth.controller.js → { UserModel }
//   controllers/user.controller.js → { UserModel, TaskModel }
//   controllers/task.controller.js → { TaskModel }
// ============================================================

// Importa cada modelo (capa de persistencia MySQL)
const UserModel = require('./user.model');
const TaskModel = require('./task.model');

// EXPORTA ambos modelos juntos: reemplazó el antiguo readDB/writeDB (db.json)
// Cualquier archivo que haga require('../models') recibe los dos
module.exports = { UserModel, TaskModel };
