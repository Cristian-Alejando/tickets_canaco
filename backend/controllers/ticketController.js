const pool = require('../config/db'); // Importamos la conexión

// ==========================================
// 1. CREAR TICKET
// ==========================================
const createTicket = async (req, res) => {
  const { titulo, descripcion, categoria, prioridad, ubicacion, usuario_id, nombre_contacto, email_contacto } = req.body;

  try {
    const newTicket = await pool.query(
      `INSERT INTO tickets (titulo, descripcion, categoria, prioridad, ubicacion, usuario_id, nombre_contacto, email_contacto) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        titulo, 
        descripcion, 
        categoria || 'General', 
        prioridad, 
        ubicacion, 
        usuario_id || null, 
        nombre_contacto,    
        email_contacto      
      ]
    );
    
    // AQUÍ IRÁ EL CÓDIGO DE ENVÍO DE CORREO (Pendiente)
    
    res.json(newTicket.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al crear ticket');
  }
};

// ==========================================
// 2. OBTENER TODOS (¡AHORA CON TÉCNICO ASIGNADO!)
// ==========================================
const getAllTickets = async (req, res) => {
  try {
    // CAMBIO IMPORTANTE: Doble LEFT JOIN
    // 1. 'u' para saber quién creó el ticket (solicitante)
    // 2. 'tech' para saber a quién se le asignó (técnico)
    const allTickets = await pool.query(`
      SELECT 
        t.*, 
        COALESCE(u.nombre, t.nombre_contacto) AS usuario_nombre,
        COALESCE(u.email, t.email_contacto) AS usuario_email,
        u.telefono AS usuario_telefono,
        tech.nombre AS tecnico_nombre  -- // NUEVO: Traemos el nombre del técnico
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN usuarios tech ON t.asignado_a = tech.id -- // NUEVO: Join con usuarios otra vez
      ORDER BY t.fecha_creacion DESC
    `);
    
    res.json(allTickets.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor al obtener tickets");
  }
};

// ==========================================
// 3. ACTUALIZAR (Gestión + ASIGNACIÓN)
// ==========================================
const updateTicket = async (req, res) => {
  const { id } = req.params;
  // AHORA RECIBIMOS TAMBIÉN 'asignado_a'
  const { titulo, descripcion, ubicacion, categoria, estatus, prioridad, comentarios, asignado_a } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tickets 
       SET titulo = $1,
           descripcion = $2,
           ubicacion = $3,
           categoria = $4,
           estatus = $5,
           prioridad = $6,
           comentarios = $7,
           asignado_a = $8,  -- // NUEVO: Guardamos el ID del técnico
           fecha_actualizacion = NOW(),
           fecha_cierre = CASE WHEN $5::varchar = 'resuelto' THEN NOW() ELSE NULL END
       WHERE id = $9 RETURNING *`,
      [
        titulo, 
        descripcion, 
        ubicacion, 
        categoria, 
        estatus, 
        prioridad, 
        comentarios, 
        asignado_a, // // NUEVO: Pasamos el valor
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 4. VOTAR (Lógica Anti-Duplicados)
// ==========================================
const voteTicket = async (req, res) => {
  const { id } = req.params;      
  const { usuario_id } = req.body; 

  try {
    await pool.query("INSERT INTO votos_registro (ticket_id, usuario_id) VALUES ($1, $2)", [id, usuario_id]);
    const result = await pool.query("UPDATE tickets SET votos = votos + 1 WHERE id = $1 RETURNING *", [id]);
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: "Ya has votado por este ticket" });
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 5. BUSCADOR
// ==========================================
const searchTickets = async (req, res) => {
  const { q } = req.query; 
  if (!q || q.trim() === '') return res.json([]);
  try {
    const result = await pool.query(
      `SELECT t.*, u.nombre as usuario_nombre 
       FROM tickets t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.titulo ILIKE $1 AND t.estatus != 'resuelto' LIMIT 3`,
      [`%${q}%`] 
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 6. MIS VOTOS
// ==========================================
const getUserVotes = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await pool.query("SELECT ticket_id FROM votos_registro WHERE usuario_id = $1", [usuario_id]);
    res.json(result.rows.map(row => row.ticket_id)); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener votos" });
  }
};

// ==========================================
// 7. BORRAR TICKET
// ==========================================
const deleteTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json({ message: 'Ticket eliminado correctamente', ticket: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el ticket. Puede tener registros relacionados.' });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  updateTicket,
  voteTicket,
  searchTickets,
  getUserVotes,
  deleteTicket
};