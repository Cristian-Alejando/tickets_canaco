# 🗄️ Instrucciones para la Base de Datos (CANACO)
> **Última actualización:** 7 de Abril de 2026

Este documento contiene los scripts SQL necesarios para actualizar una base de datos existente o crear una nueva desde cero para el sistema de **Tickets CANACO**.

---

## 🛠️ 0. Parches y Actualizaciones
*Ejecuta estos comandos **SOLO** si necesitas actualizar tu base de datos actual para soportar las nuevas funciones (Asignación de tickets, Soft-Delete, Evidencias, Bitácora, etc).*

```sql
-- 1. Soporte para invitados (nombre y email en ticket)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS email_contacto VARCHAR(100);

-- 2. Soporte para Asignación de Técnicos
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;

-- 3. Soporte para Teléfono de usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- 4. Soporte para "Soft Delete" (Desactivar usuarios sin borrarlos)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- 5. Soporte para Departamento y Evidencia Fotográfica (Sharp/Multer)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS departamento VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS evidencia TEXT;

-- 6. NUEVO: Soporte para Bitácora de Auditoría (Historial de cambios inmutable)
CREATE TABLE IF NOT EXISTS bitacora_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 1. Creación desde Cero (Instalación Limpia)
*Ejecuta estos comandos en orden si vas a borrar todo y empezar una instalación nueva.*

### Paso 1: Crear la Base de Datos
```sql
CREATE DATABASE tickets_canaco;
```

### Paso 2: Crear Tablas Principales
```sql
-- A) Tabla de Usuarios (Con soporte de activo y teléfono)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Soporta texto plano (legacy) y bcrypt
    rol VARCHAR(50) DEFAULT 'tecnico', -- admin, tecnico, empleado
    telefono VARCHAR(20),             -- Para contacto directo
    activo BOOLEAN DEFAULT TRUE       -- Para borrado lógico (soft delete)
);

-- B) Tabla de Tickets (Con asignación, contacto externo y evidencia)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(150),
    categoria VARCHAR(100),
    estatus VARCHAR(50) DEFAULT 'Abierto',
    prioridad VARCHAR(50) DEFAULT 'media',
    votos INTEGER DEFAULT 0,
    comentarios TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL, 
    nombre_contacto VARCHAR(100), 
    email_contacto VARCHAR(100),  
    asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    departamento VARCHAR(100),
    evidencia VARCHAR(255)
);

-- C) Tabla de Historial de Votos (Previene votos duplicados)
CREATE TABLE votos_registro (
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, usuario_id)
);

-- D) NUEVO: Tabla de Bitácora de Auditoría (Trazabilidad de cambios)
CREATE TABLE bitacora_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌱 2. Usuarios Iniciales (Semilla)
*Cuentas por defecto para acceder al panel administrativo por primera vez.*

```sql
-- Usuario Admin Principal
INSERT INTO usuarios (nombre, email, password, rol, telefono, activo)
VALUES ('Administrador', 'admin@canaco.com', 'admin123', 'admin', '8112345678', TRUE);

-- Usuario Técnico de Prueba
INSERT INTO usuarios (nombre, email, password, rol, telefono, activo)
VALUES ('Soporte TI', 'soporte@canaco.com', '123456', 'tecnico', '8187654321', TRUE);
```

---

## 📌 Notas Técnicas y Despliegue

### 🔒 Seguridad y Acceso (Fase Búnker)
- **Contraseñas**: El sistema utiliza `bcryptjs`. Si insertas usuarios manualmente con código SQL, el sistema los detectará como texto plano temporalmente gracias al soporte *legacy*, y los encriptará automáticamente tras su primer inicio de sesión exitoso.
- **Borrado de Usuarios**: El sistema utiliza **"Soft Delete"**. Al eliminar un usuario en el panel, NO se borra la fila para evitar romper las relaciones en la `bitacora_tickets` y `tickets`. Solo se actualiza su estado a `activo = FALSE`.
- **Esterilización de Datos**: El backend utiliza `DOMPurify` para limpiar cualquier script malicioso (XSS) ANTES de insertar los datos en estas tablas.

### 🔌 Conexión Local
- **Puerto Backend**: `3000` (Soporta WebSockets)
- **Base de Datos**: `PostgreSQL` (Puerto `5432`)

### ⚙️ Variables de Entorno Requeridas (`.env`)
Asegúrate de crear tu archivo `.env` en la carpeta `/backend` con la siguiente estructura:
```env
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tickets_canaco
JWT_SECRET=tu_secreto_super_seguro
EMAIL_USER=helpdesk.canacomty@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
```