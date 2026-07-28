import app from "./src/app.js";

const PORT = process.env.PORT || 3002;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
