require('dotenv').config(); // Agregamos esto para que lea tu archivo .env
const pool = require('./config/db');

const ejecutarSQL = async () => {
    try {
        console.log("⏳ Conectando a la base de datos...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bitacora_tickets (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
                accion VARCHAR(50) NOT NULL, 
                detalles TEXT NOT NULL, 
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log("✅ ¡Tabla 'bitacora_tickets' creada con éxito!");
    } catch (error) {
        console.error("❌ Error al crear la tabla:", error.message);
    } finally {
        pool.end(); 
    }
};

ejecutarSQL();