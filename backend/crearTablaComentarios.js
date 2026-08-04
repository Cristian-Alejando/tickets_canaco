require('dotenv').config();
const pool = require('./config/db');

const crearTablaComentarios = async () => {
    try {
        console.log("⏳ Conectando a la base de datos para crear la tabla de comentarios...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comentarios (
                id SERIAL PRIMARY KEY,
                titulo VARCHAR(200) NOT NULL,
                problematica TEXT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log("✅ ¡Tabla 'comentarios' verificada / creada con éxito!");
    } catch (error) {
        console.error("❌ Error al crear la tabla 'comentarios':", error.message);
    } finally {
        pool.end();
    }
};

crearTablaComentarios();
