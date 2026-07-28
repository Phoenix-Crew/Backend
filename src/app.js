import express from "express";
import cors from "cors";
import { readDB } from "./models/database.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import taskRoutes from "./routes/task.routes.js";
import { getDashboard, getUserTasks } from "./controllers/task.controller.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/dashboard", getDashboard);

app.get("/api/users/:userId/tasks", getUserTasks);

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API REST - Gestión de Tareas v3.0",
    data: { status: "running" },
    errors: [],
  });
});

export default app;
