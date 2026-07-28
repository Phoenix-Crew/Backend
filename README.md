# Backend — API REST Gestión de Tareas

<!-- [F2 - Brian] Actualizar con instrucciones de configuración de BD -->
<!-- [F2 - Brian] Documentar variables de entorno, migración de datos -->
<!-- [F2 - Brian] Agregar pasos para crear la BD con init.sql -->

## Requisitos
- Node.js ≥ 18
- MySQL o PostgreSQL
- npm

## Instalación
```bash
npm install
cp .env.example .env   # [B3 - Brian] Configurar credenciales de BD
npm start              # http://localhost:3002
```

## Script BD
Ejecutar `src/database/init.sql` en MySQL para crear la base de datos y tablas.
