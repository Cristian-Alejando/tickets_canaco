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
- Backend: Node.js + Express (API REST unificada con CORS dinámico en 0.0.0.0).
- Frontend: SPA en React, construcción con Vite (Proxy inverso configurado para desarrollo).
- BD: PostgreSQL (pg Pool).
- Autenticación: bcryptjs con soporte híbrido para contraseñas legacy (migración segura).

Funcionalidades principales
---------------------------
- Autenticación híbrida: soporta contraseñas hasheadas y legacy para migración.
- Buzón público: creación de tickets por usuarios.
- Panel administrativo: gestión de estatus, prioridad, usuarios y votos.
- Sistema de votación para priorizar incidencias; prevención de votos duplicados.
- Desarrollo colaborativo en vivo: soporte para múltiples redes locales e internet mediante túneles seguros (ngrok) interceptando HMR.
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
    - services/    — Comunicación con la API (Headers anti-bloqueo configurados).
    - config.js    — URL base de la API.
    - App.jsx
  - vite.config.js — Configuración de Proxy interno e IPs permitidas.
  - package.json
- docs/ (instrucciones, scripts SQL)

Instalación y ejecución (Desarrollo)
-----------------------------------
Requisitos: Node.js, npm, PostgreSQL, cuenta de ngrok (Opcional para redes aisladas).

1. Base de datos
   - Crear BD (ej. tickets_canaco) y ejecutar scripts SQL en docs/instrucciones_db.txt.
   - Configurar usuario/contraseña y variables de conexión.

2. Backend
   ```bash
   cd backend
   npm install
   # crear .env basado en .env.example (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT)
   npm run dev   # usa nodemon en el puerto 3000 (escuchando en 0.0.0.0)
   ```

3. Frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   # o 'npm run dev -- --host' si deseas probar directamente con la IP local sin ngrok
   ```
   **Importante:** El archivo `frontend/src/config.js` debe mantener `export const API_URL = '';`. Vite se encarga de redirigir las peticiones internamente al backend a través de la configuración de proxy en `vite.config.js`.

Despliegue remoto seguro en vivo (ngrok)
--------------------------------
Para permitir que toda la oficina se conecte simultáneamente, independientemente de la red a la que estén conectados (Internet A, B, o datos móviles), usamos ngrok apuntando al servidor de desarrollo de Vite.

1. Asegúrate de tener una cuenta activa en ngrok y el Authtoken configurado en tu terminal.
2. Inicia tu Backend (`npm run dev`) y tu Frontend (`npm run dev`) en dos terminales separadas.
3. Abre una tercera terminal y ejecuta:
   ```bash
   ngrok http 5173
   ```
4. Comparte la URL de "Forwarding" que genera ngrok. 

*Nota: Las peticiones fetch en `ticketService.js` ya cuentan con el header `'ngrok-skip-browser-warning': 'true'` para evitar que el navegador bloquee la API en la primera visita.*

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
- Ya no es necesario actualizar manualmente `frontend/src/config.js`. Si el puerto del backend cambia en un futuro, actualiza la propiedad proxy dentro de `frontend/vite.config.js`.
- Revisar la integridad de la tabla votos_registro para evitar votos duplicados.

Referencias rápidas
-------------------
- backend/server.js
- backend/config/db.js
- backend/controllers/authController.js
- frontend/vite.config.js
- frontend/src/config.js
- frontend/src/services/

Créditos
--------
Desarrollado por: Cristian — CANACO Monterrey  
Año: 2026

Licencia
--------
Añadir archivo LICENSE según políticas institucionales antes de publicar.