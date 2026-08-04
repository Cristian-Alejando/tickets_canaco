const pool = require('../config/db');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = createDOMPurify(window);

// ==========================================
// 1. OBTENER TODOS LOS COMENTARIOS
// ==========================================
const getComentarios = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                titulo, 
                problematica, 
                fecha_creacion
            FROM comentarios 
            ORDER BY fecha_creacion DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener comentarios:", error);
        res.status(500).json({ error: "Error interno del servidor al consultar comentarios" });
    }
};

// ==========================================
// 2. CREAR UN NUEVO COMENTARIO (ANÓNIMO)
// ==========================================
const createComentario = async (req, res) => {
    const { titulo, problematica } = req.body;

    if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: "El título es obligatorio" });
    }

    if (!problematica || !problematica.trim()) {
        return res.status(400).json({ error: "La problemática es obligatoria" });
    }

    // Sanitizar entradas para prevenir ataques XSS
    const tituloLimpio = purify.sanitize(titulo.trim());
    const problematicaLimpia = purify.sanitize(problematica.trim());

    try {
        const query = `
            INSERT INTO comentarios (titulo, problematica)
            VALUES ($1, $2)
            RETURNING id, titulo, problematica, fecha_creacion
        `;
        const result = await pool.query(query, [tituloLimpio, problematicaLimpia]);
        const nuevoComentario = result.rows[0];

        // Emitir a través de WebSockets para actualización en tiempo real
        const io = req.app.get('socketio');
        if (io) {
            io.emit('comentario_creado', nuevoComentario);
        }

        res.status(201).json(nuevoComentario);
    } catch (error) {
        console.error("❌ Error al guardar comentario:", error);
        res.status(500).json({ error: "Error al guardar el comentario en la base de datos" });
    }
};

// ==========================================
// 3. ELIMINAR UN COMENTARIO
// ==========================================
const deleteComentario = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM comentarios WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Comentario no encontrado" });
        }

        // Emitir a través de WebSockets para sincronización en tiempo real
        const io = req.app.get('socketio');
        if (io) {
            io.emit('comentario_eliminado', Number(id));
        }

        res.status(200).json({ ok: true, message: "Comentario eliminado exitosamente" });
    } catch (error) {
        console.error("❌ Error al eliminar comentario:", error);
        res.status(500).json({ error: "Error interno del servidor al eliminar comentario" });
    }
};

module.exports = {
    getComentarios,
    createComentario,
    deleteComentario
};
