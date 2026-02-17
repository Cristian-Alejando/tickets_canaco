# 🎫 Sistema de Tickets CANACO — Mesa de Ayuda Interna

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Postgres-336791?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![bcryptjs](https://img.shields.io/badge/bcryptjs-6CC24A?logo=bcrypt&logoColor=white)

Estado: En Desarrollo / Producción  
Versión: 1.2.0  
Autor: Cristian — CANACO Monterrey

Resumen
-------
Sistema de gestión de tickets (Help Desk) diseñado para centralizar reportes, priorizar incidencias mediante votación de usuarios y proporcionar un panel administrativo para la gestión completa de casos. Arquitectura MVC con Backend unificado y Frontend en React (Vite).

Arquitectura
-----------
- Patrón: Modelo–Vista–Controlador (MVC).
- Backend: Node.js + Express (API REST unificada).
- Frontend: SPA en React, construcción con Vite.
- BD: PostgreSQL (pg Pool).
- Autenticación: bcryptjs con soporte híbrido para contraseñas legacy (migración segura).

Funcionalidades principales
---------------------------
- Autenticación híbrida: soporta contraseñas hasheadas y legacy para migración.
- Buzón público: creación de tickets por usuarios.
- Panel administrativo: gestión de estatus, prioridad, usuarios y votos.
- Sistema de votación para priorizar incidencias; prevención de votos duplicados.
- Soporte de despliegue local y remoto mediante túneles seguros (ngrok).
- Backend sirve la build de frontend (producción).

Estructura del proyecto
-----------------------
- /backend
  - config/        — Conexión a PostgreSQL (pool).
  - controllers/   — Lógica de negocio (auth, tickets).
  - routes/        — Endpoints de la API.
  - server.js      — Punto de entrada del servidor.
  - package.json
- /frontend
  - src/
    - components/  — UI reutilizable.
    - pages/       — Vistas (Login, Dashboard).
    - services/    — Comunicación con la API.
    - config.js    — URL del backend / configuración.
    - App.jsx
  - package.json
- docs/ (instrucciones, scripts SQL)

Instalación y ejecución (Desarrollo)
-----------------------------------
Requisitos: Node.js, npm, PostgreSQL.

1. Base de datos
   - Crear BD (ej. tickets_canaco) y ejecutar scripts SQL en docs/instrucciones_db.txt.
   - Configurar usuario/contraseña y variables de conexión.

2. Backend
   ```bash
   cd backend
   npm install
   # crear .env basado en .env.example (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT)
   npm run dev   # usa nodemon (ver package.json)
   ```
   Nota: el servidor sirve la carpeta build del frontend en producción desde ../frontend/dist

3. Frontend
   ```bash
   cd frontend
   npm install
   npm run dev -- --host   # Vite en modo desarrollo accesible en LAN
   ```
   - Actualizar frontend/src/config.js con la URL del backend (ej. http://192.168.x.x:3000 o el túnel ngrok).

Empaquetado y despliegue (Producción)
-------------------------------------
1. Generar build del frontend:
   ```bash
   cd frontend
   npm run build
   ```
   Output: frontend/dist

2. Ejecutar backend en modo producción para servir la build:
   ```bash
   cd backend
   # establecer .env apropiado
   node server.js
   ```
   - Opcional: usar PM2, Docker o un reverse proxy (nginx) para gestión en producción.

Despliegue remoto seguro (ngrok)
--------------------------------
- Para exponer localmente:
  ```bash
  ngrok http 3000
  ```
- Actualizar frontend/src/config.js con la URL pública devuelta por ngrok.

Variables de entorno recomendadas (.env)
----------------------------------------
- PORT=3000
- DB_HOST=
- DB_PORT=5432
- DB_USER=
- DB_PASSWORD=
- DB_NAME=
- JWT_SECRET=
- NODE_ENV=production|development

API — Endpoints representativos
-------------------------------
- POST /auth/login             — Autenticación
- POST /auth/register          — Registrar usuario (admin)
- GET  /tickets                — Listar tickets
- POST /tickets                — Crear ticket público
- PUT  /tickets/:id            — Actualizar ticket (admin)
- PUT  /tickets/:id/voto       — Sumar voto a ticket
- GET  /tickets/buscar?q=...   — Búsqueda predictiva

Base de datos — esquema básico
-----------------------------
Tablas principales: tickets, usuarios, votos_registro  
Ejemplo (resumen):
- tickets: id (PK), titulo, descripcion, estatus, prioridad, votos, created_at, closed_at
- usuarios: id (PK), email, password_hash, rol
- votos_registro: id, ticket_id, usuario_id, created_at

Buenas prácticas y seguridad
----------------------------
- No commitear .env ni credenciales.
- Hashear contraseñas nuevas con bcryptjs; mantener compatibilidad para migración de legacy.
- Validar y sanitizar entradas en backend.
- Limitar exposición de puertos y usar túneles seguros o proxy SSL en producción.

Mantenimiento
------------
- Mantener dependencia de Postgres activa antes de iniciar backend.
- Actualizar frontend/src/config.js cuando cambie la URL del backend.
- Revisar la integridad de la tabla votos_registro para evitar votos duplicados.

Referencias rápidas
-------------------
- backend/server.js
- backend/config/db.js
- backend/controllers/authController.js
- backend/controllers/ticketController.js
- backend/routes/authRoutes.js
- backend/routes/ticketRoutes.js
- frontend/src/config.js
- frontend/src/services/

Créditos
--------
Desarrollado por: Cristian — CANACO Monterrey  
Año: 2026

Licencia
--------
Añadir archivo LICENSE según políticas institucionales antes de publicar.