# 🎫 Sistema de Tickets CANACO - Mesa de Ayuda Interna

> **Estado del Proyecto:** En Desarrollo / Producción
> **Versión:** 1.2.0

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [Características Principales](#-características-principales)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Despliegue](#-instalación-y-despliegue)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#️-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Mantenimiento](#-mantenimiento)
- [Autor](#-autor)

## 🎯 Descripción General

El **Sistema de Tickets CANACO** es una solución integral de **Help Desk** diseñada para optimizar la gestión de incidencias de Mantenimiento y Sistemas dentro de la Cámara Nacional de Comercio de Monterrey.

El sistema reemplaza la gestión informal (WhatsApp/Papel) por una plataforma centralizada que permite reportar fallas, priorizar tareas mediante un sistema de votación de afectados y generar métricas de resolución.

### Propósito
- Centralizar reportes de fallas (Aire acondicionado, Red, Mobiliario).
- Priorizar incidencias basándose en el impacto (Votos de usuarios afectados).
- Proveer un historial de soluciones para futura referencia.

## 🏗️ Arquitectura del Sistema

El proyecto utiliza una arquitectura **Cliente-Servidor (REST API)** moderna y desacoplada.

```mermaid
graph TD
    User[Usuario / Empleado] -->|Navegador Web| Frontend
    Frontend[React + Vite + Tailwind] -->|JSON / HTTP| Backend
    Backend[Node.js + Express] -->|SQL Queries| DB
    DB[(PostgreSQL)]

Componentes Técnicos
Frontend: Single Page Application (SPA) construida con React 18.

Backend: API RESTful construida con Node.js y Express.

Base de Datos: PostgreSQL relacional para integridad de datos.

Red: Configurado para acceso vía IP local (LAN) dentro de las oficinas.

✨ Características Principales
🎫 Gestión de Incidencias
Creación Rápida: Formulario simplificado con detección de duplicados en tiempo real.

Priorización Dinámica: Sistema de "Votos" donde múltiples usuarios pueden reportar el mismo problema, elevando su urgencia automáticamente.

Categorización: Clasificación por áreas (Sistemas, Mantenimiento, Limpieza, Seguridad).

🛠️ Panel Administrativo (Dashboard)
Kanban Simplificado: Vista rápida de tickets Pendientes, En Proceso y Resueltos.

Gestión de Estados: Cambio de estatus y prioridad en tiempo real.

Historial de Soluciones: Archivo muerto de casos resueltos con notas técnicas de la solución aplicada.

🔐 Seguridad y Acceso
Roles de Usuario:

Empleado: Solo puede crear y votar.

Técnico/Admin: Puede editar, cambiar estatus y cerrar tickets.

Autenticación: Login seguro contra base de datos PostgreSQL.

🚀 Instalación y Despliegue
1. Configuración de Base de Datos
Ejecutar el script SQL incluido en docs/instrucciones_db.txt utilizando pgAdmin 4.

Base de datos: tickets_canaco

Puerto default: 5432

2. Instalación del Backend (API)
cd backend
npm install
# Crear archivo .env basado en .env.example
npm start

3. Instalación del Frontend (Cliente)cd frontend
npm install
# Verificar IP en src/config.js para acceso en red
npm run dev -- --host

📁 Estructura del Proyecto
El proyecto sigue una arquitectura modular y escalable:

SistemaTicketsCanaco/
├── backend/
│   ├── config/         # Conexión a DB (Pool)
│   ├── controllers/    # Lógica de negocio (CRUD Tickets)
│   ├── routes/         # Definición de Endpoints
│   └── index.js        # Punto de entrada del servidor
│
├── frontend/
│   ├── src/
│   │   ├── components/ # Piezas UI reutilizables (Navbar, Cards)
│   │   ├── pages/      # Vistas completas (Login, Dashboard)
│   │   ├── services/   # Comunicación con API (Fetch)
│   │   ├── utils/      # Funciones auxiliares (Formatos de fecha)
│   │   └── App.jsx     # Orquestador principal
│   └── public/         # Assets estáticos

🗄️ Base de Datos
El esquema relacional está diseñado para evitar redundancia y permitir auditoría.
Tabla: tickets
Columna         Tipo        Descripción
id              SERIAL	    PK
titulo	        VARCHAR	    Resumen del problema
estatus	        VARCHAR	    abierto, en_proceso, resuelto
prioridad	    VARCHAR	    baja, media, alta
votos	        INT	        Contador de afectados
fecha_cierre	TIMESTAMP	Fecha de resolución

Tabla: usuarios
Columna	    Tipo	    Descripción
id	        SERIAL	    PK
email	    VARCHAR	    Credencial de acceso
rol	        VARCHAR	    admin, tecnico, empleado

🔌 API Endpoints
Método      Endpoint                Descripción
GET	        /tickets	            Obtener todos los tickets activos
POST	    /tickets	            Crear nuevo reporte
PUT	        /tickets/:id	        Actualizar estatus/prioridad (Admin)
PUT	        /tickets/:id/voto	    Sumar voto a un ticket existente
POST	    /login	                Autenticación de usuarios
GET	        /tickets/buscar?q=...	Buscador predictivo

💻 Tecnologías Utilizadas
🔧 Mantenimiento
Notas para futuros desarrolladores:
Cambio de IP: Si el servidor cambia de IP, actualizar frontend/src/config.js.

PostgreSQL: Asegurar que el servicio de Postgres esté corriendo antes de iniciar el backend.

Refactorización: El frontend utiliza una arquitectura de servicios en src/services. Evitar hacer fetch directamente en los componentes.

👤 Autor
Desarrollado para el Depto. de Sistemas CANACO Monterrey.

Desarrollador: Cristian

Rol: Practicante de Sistemas

Año: 2026