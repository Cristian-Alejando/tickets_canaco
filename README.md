# Sistema de Gestión de Tickets CANACO (Helpdesk)

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Build_Tool-Vite-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Real_Time-Socket.io-010101?logo=socketdotio&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Infra-Cloudflare_Zero_Trust-F38020?logo=cloudflare&logoColor=white)

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Características Principales](#características-principales)
- [Seguridad e Infraestructura](#seguridad-e-infraestructura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Esquema de Base de Datos](#esquema-de-base-de-datos)
- [Mantenimiento y Despliegue](#mantenimiento-y-despliegue)

## Descripción General

El presente proyecto constituye el Sistema Integral de Mesa de Ayuda (Helpdesk) desarrollado para la Cámara Nacional de Comercio (CANACO). Su propósito principal es centralizar, priorizar y gestionar las incidencias internas de manera eficiente y escalable. La plataforma está concebida como una aplicación de misión crítica que asegura el seguimiento puntual de las solicitudes, reduciendo la redundancia operativa mediante inteligencia heurística en la capa de persistencia y una comunicación fluida en tiempo real.

## Arquitectura del Sistema

La solución emplea una arquitectura distribuida basada en el modelo cliente-servidor, implementando conexiones persistentes y bidireccionales. El diseño prioriza la alta disponibilidad, la optimización de recursos en el procesamiento de medios y la inmutabilidad de los registros transaccionales.

## Stack Tecnológico

El ecosistema tecnológico ha sido seleccionado bajo criterios de rendimiento, mantenibilidad y seguridad corporativa:

### Frontend
- **Librería Base**: React implementando arquitecturas orientadas a componentes y flujos de estado declarativos.
- **Herramienta de Construcción**: Vite, empleado para garantizar tiempos de compilación óptimos y un empaquetado eficiente (HMR).
- **Estilos**: Tailwind CSS, utilizado para la construcción de una interfaz responsiva, modular y consistente con las directrices de diseño UI/UX.
- **Visualización de Datos**: Recharts, encargado de la generación y renderizado de gráficos estadísticos asíncronos para los tableros de control directivos (Dashboards).

### Backend
- **Entorno de Ejecución**: Node.js gestionando un servidor web mediante el framework Express.
- **Base de Datos Relacional**: PostgreSQL, seleccionado por su integridad referencial, transaccionalidad ACID y capacidad para manejar consultas jerárquicas y paginación en altos volúmenes de datos.
- **Procesamiento de Archivos**: Arquitectura de alto rendimiento combinando **Multer** (gestionando el buffer directamente en memoria RAM) y **Sharp** (para la compresión destructiva controlada y conversión al formato `.webp`). Esto minimiza la latencia de disco y optimiza drásticamente el peso de las evidencias visuales.

### Tiempo Real
- **WebSockets**: Integración nativa de Socket.io para garantizar la propagación instantánea de eventos de mutación (creación, actualización y eliminación de incidencias), permitiendo una reactividad fluida sin sobrecarga de sondeo (polling).

## Características Principales

- **Gestión Estricta de Votos (Anti-Redundancia)**: Flujo de trabajo algorítmico que previene la proliferación de incidencias duplicadas. Si la validación heurística detecta similitud semántica y de ubicación, el sistema induce a la adhesión de votos. Este modelo carece de lógica de retroceso (toggle); una vez registrado, el voto es definitivo y auditado en la base de datos (con rechazo estricto HTTP 400 ante duplicidad).
- **Actualizaciones Optimistas en Interfaz (UI)**: La experiencia del usuario final se optimiza mediante actualizaciones optimistas de estado, reflejando inmediatamente el éxito de las interacciones (como la votación) y ejecutando rutinas de reversión silente en caso de discrepancia o fallo transaccional con el servidor.
- **Manejo de Evidencias Visuales**: Recepción y procesamiento concurrente de archivos multimedia. Las imágenes son optimizadas dinámicamente antes de su persistencia en el sistema de archivos, asegurando un consumo de ancho de banda marginal durante la recuperación de las mismas.
- **Bitácora de Auditoría Inmutable**: Todo cambio de estado (estatus, prioridades, delegaciones) genera un registro permanente de auditoría, documentando la identidad del operador, la estampa de tiempo y la naturaleza de la modificación.

## Seguridad e Infraestructura

La plataforma opera bajo principios de confianza cero (Zero Trust) y mitigación proactiva de amenazas:

- **Autenticación Basada en Tokens**: Control de acceso granular mediante JSON Web Tokens (JWT). La integridad y vigencia de cada transacción se verifica en los middlewares protectores antes de conceder acceso a los controladores.
- **Limitación de Peticiones (Rate Limit)**: Implementación de `express-rate-limit` mitigando activamente ataques de Denegación de Servicio (DDoS) y previniendo el abuso de los puntos de conexión públicos.
- **Despliegue Aislado (Cloudflare Zero Trust)**: La infraestructura se expone al exterior de manera segura utilizando túneles de Cloudflare. Esta configuración anula la necesidad de exponer puertos en los cortafuegos físicos y cifra el tráfico de extremo a extremo (E2EE), mitigando ataques volumétricos y escaneos de vulnerabilidades.
- **Protección contra XSS**: Esterilización rigurosa del texto entrante empleando librerías especializadas (DOMPurify con JSDOM) para la limpieza profunda de vectores de ataque.

## Requisitos Previos

- **Node.js**: Versión 18.0 o superior.
- **Gestor de Paquetes**: NPM (incluido con Node.js).
- **Base de Datos**: PostgreSQL 14 o superior.
- **Sistema Operativo**: Compatible con distribuciones Linux, macOS y Windows Server.

## Instalación y Configuración

1. **Clonación del Repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd tickets_canaco
   ```

2. **Inicialización de la Base de Datos**
   Configure su instancia de PostgreSQL y proceda con la ejecución de los scripts DDL proveídos en el directorio de inicialización.
   ```sql
   CREATE DATABASE tickets_canaco;
   ```

3. **Configuración del Entorno de Servidor (Backend)**
   ```bash
   cd backend
   npm install
   ```
   Genere el archivo `.env` tomando como referencia las siguientes variables requeridas:
   ```env
   PORT=3000
   DB_USER=usuario_pg
   DB_PASSWORD=contraseña_pg
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tickets_canaco
   JWT_SECRET=clave_criptografica_segura
   EMAIL_USER=correo_corporativo
   EMAIL_PASS=contraseña_de_aplicacion
   ```

4. **Configuración y Empaquetado de la Interfaz (Frontend)**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

## Esquema de Base de Datos

La estructura relacional incluye, entre otras, las siguientes entidades fundamentales:
- `tickets`: Núcleo operativo de las incidencias.
- `usuarios`: Directorio de colaboradores y personal administrativo con definición estricta de roles.
- `bitacora_tickets`: Tabla auxiliar de inserción única para propósitos de auditoría y cumplimiento.
- `votos_registro`: Tabla de intersección que impone restricciones de unicidad para la emisión de votos por incidencia.

## Mantenimiento y Despliegue

Para el entorno de producción, es imperativo mantener los servicios ejecutándose en segundo plano. Se recomienda el uso de un gestor de procesos avanzado como PM2.

```bash
# Servidor de Interfaz de Programación de Aplicaciones (API)
cd backend
pm2 start server.js --name "canaco-backend"

# Servidor de Interfaz de Usuario (UI) Estática
cd frontend
pm2 start start-serve.js --name "canaco-frontend"
```

El estado operacional y el archivo de registros se pueden monitorizar empleando los comandos `pm2 status` y `pm2 logs`.