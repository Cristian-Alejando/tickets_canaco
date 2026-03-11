const pool = require('../config/db'); // Importamos la conexión
const transporter = require('../config/mailer'); // <-- NUEVO: Importamos al cartero de Nodemailer

// ==========================================
// 1. CREAR TICKET (¡AHORA CON EVIDENCIA!)
// ==========================================
const createTicket = async (req, res) => {
  const { 
    titulo, 
    descripcion, 
    categoria, 
    prioridad, 
    ubicacion, 
    usuario_id, 
    nombre_contacto, 
    email_contacto,
    departamento 
  } = req.body;

  // 👇 NUEVO: Sacamos la ruta de la foto si es que el usuario subió una 👇
  // Si req.file existe, armamos la ruta completa. Si no, lo dejamos como null.
  const rutaEvidencia = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const newTicket = await pool.query(
      // 👇 NUEVO: Agregamos la columna 'evidencia' a la consulta SQL 👇
      `INSERT INTO tickets (titulo, descripcion, categoria, prioridad, ubicacion, usuario_id, nombre_contacto, email_contacto, departamento, estatus, evidencia) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Abierto', $10) RETURNING *`,
      [
        titulo, 
        descripcion, 
        categoria || 'General', 
        prioridad || 'baja', 
        ubicacion, 
        usuario_id || null, 
        nombre_contacto,    
        email_contacto,
        departamento,
        rutaEvidencia // <--- Pasamos la variable que contiene la ruta de la foto
      ]
    );

    const ticketGuardado = newTicket.rows[0];

    // ==========================================
    // INICIO DE LÓGICA DE CORREO AUTOMÁTICO (CREAR)
    // ==========================================
    const correoAdmin = 'cristianpowa777@gmail.com'; 

    if (email_contacto && email_contacto.trim() !== '') {
        const mailOptions = {
            from: '"Soporte CANACO" <helpdesk.canacomty@gmail.com>',
            to: `${email_contacto}, ${correoAdmin}`,
            subject: `🎫 Reporte Recibido - Folio #${ticketGuardado.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
                    <h2 style="color: #003366;">¡Reporte registrado con éxito!</h2>
                    <p>Hola <strong>${nombre_contacto || 'colaborador'}</strong>, hemos recibido tu solicitud.</p>
                    
                    <h3 style="color: #003366; margin-top: 20px;">Detalles de tu reporte:</h3>
                    <ul style="list-style-type: none; padding-left: 0;">
                        <li style="margin-bottom: 5px;"><strong>Folio:</strong> #${ticketGuardado.id}</li>
                        <li style="margin-bottom: 5px;"><strong>Asunto reportado:</strong> ${titulo}</li>
                        <li style="margin-bottom: 5px;"><strong>Ubicación:</strong> ${ubicacion} (${departamento})</li>
                        <li style="margin-bottom: 5px;"><strong>Estatus:</strong> Abierto 🟡</li>
                    </ul>
                    <p>El departamento correspondiente ya tiene tu caso y lo revisará a la brevedad.</p>
                    <br><br>
                    
                    <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Century Gothic', Arial, sans-serif; margin-top: 20px;">
                      <tr>
                        <td style="padding-right: 15px; border-right: 1px solid #336699; vertical-align: top;">
                          <img src="https://i.ibb.co/0yw9rvv8/LOGO-CANACO.png" alt="CANACO Monterrey" width="110" style="display: block;">
                        </td>
                        <td style="padding-left: 15px; vertical-align: top;">
                          <h3 style="margin: 0; font-size: 16px; color: #000; font-weight: bold;">Departamento de Contabilidad</h3>
                          <p style="margin: 4px 0 15px 0; font-size: 13px; color: #333;">CANACO Monterrey</p>
                          <p style="margin: 0 0 15px 0; font-size: 13px;">
                            <a href="mailto:helpdesk.canacomty@gmail.com" style="color: #0000EE; text-decoration: underline;">helpdesk.canacomty@gmail.com</a><br>
                            <span style="color: #336699;">Tel. (81) 8150 2424</span>
                          </p>
                          <p style="margin: 0; font-size: 13px;">
                            <a href="https://www.canaco.net" style="color: #0000EE; text-decoration: underline;">www.canaco.net</a> 
                            <span style="color: #336699;"> / Canaco Monterrey /</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                    </div>
            `
        };

        transporter.sendMail(mailOptions)
            .then(() => console.log(`✉️ Correo enviado para el ticket #${ticketGuardado.id}`))
            .catch(err => console.error("❌ Error al enviar correo:", err));

    } else {
        const mailOptionsAdmin = {
            from: '"Soporte CANACO" <helpdesk.canacomty@gmail.com>',
            to: correoAdmin,
            subject: `🚨 NUEVO TICKET SIN CORREO - Folio #${ticketGuardado.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #d9534f;">¡Ojo! Nuevo reporte sin contacto</h2>
                    <p>Se levantó un ticket, pero el usuario no dejó correo para seguimiento.</p>
                    <hr>
                    <ul>
                        <li><strong>Folio:</strong> #${ticketGuardado.id}</li>
                        <li><strong>Reportado por:</strong> ${nombre_contacto || 'Anónimo'}</li>
                        <li><strong>Ubicación:</strong> ${ubicacion} (${departamento})</li>
                        <li><strong>Asunto reportado:</strong> ${titulo} - ${descripcion}</li>
                    </ul>
                    <p><em>Favor de dar seguimiento presencial o por extensión.</em></p>
                </div>
            `
        };

        transporter.sendMail(mailOptionsAdmin)
            .then(() => console.log(`✉️ Alerta de admin enviada para el ticket #${ticketGuardado.id}`))
            .catch(err => console.error("❌ Error al enviar alerta:", err));
    }

    res.json(ticketGuardado);
  } catch (err) {
    console.error("Error al crear ticket:", err.message);
    res.status(500).send('Error al crear ticket');
  }
};

// ==========================================
// 2. OBTENER TODOS 
// ==========================================
const getAllTickets = async (req, res) => {
  try {
    const allTickets = await pool.query(`
      SELECT 
        t.*, 
        COALESCE(u.nombre, t.nombre_contacto) AS usuario_nombre,
        COALESCE(u.email, t.email_contacto) AS usuario_email,
        tech.nombre AS tecnico_nombre
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN usuarios tech ON t.asignado_a = tech.id
      ORDER BY t.fecha_creacion DESC
    `);
    
    res.json(allTickets.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor al obtener tickets");
  }
};

// ==========================================
// 3. ACTUALIZAR (¡CON CORREO AUTOMÁTICO!)
// ==========================================
const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { 
    titulo, 
    descripcion, 
    ubicacion, 
    categoria, 
    estatus, 
    prioridad, 
    comentarios, 
    asignado_a,
    departamento 
  } = req.body;

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
           asignado_a = $8,
           departamento = $9, 
           fecha_actualizacion = NOW(),
           fecha_cierre = CASE WHEN $5::varchar = 'resuelto' THEN NOW() ELSE NULL END
       WHERE id = $10 RETURNING *`,
      [
        titulo, descripcion, ubicacion, categoria, estatus, prioridad, 
        comentarios, asignado_a, departamento, id            
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const ticketAct = result.rows[0];

    // ==========================================
    // INICIO DE LÓGICA DE CORREO AUTOMÁTICO (ACTUALIZAR)
    // ==========================================
    if (ticketAct.email_contacto && ticketAct.email_contacto.trim() !== '') {
        let colorEstatus = "#336699"; // Azul por defecto
        let tituloEstatus = "Actualización de tu reporte";
        
        if (estatus.toLowerCase() === 'resuelto') {
            colorEstatus = "#28a745"; // Verde
            tituloEstatus = "¡Tu reporte ha sido resuelto!";
        } else if (estatus.toLowerCase() === 'en proceso') {
            colorEstatus = "#ffc107"; // Amarillo
        }

        const mailOptions = {
            from: '"Soporte CANACO" <helpdesk.canacomty@gmail.com>',
            to: ticketAct.email_contacto,
            subject: `🔄 Actualización de Ticket - Folio #${ticketAct.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
                    <h2 style="color: ${colorEstatus};">${tituloEstatus}</h2>
                    <p>Hola <strong>${ticketAct.nombre_contacto || 'colaborador'}</strong>,</p>
                    <p>Tu ticket ha cambiado al estatus: <strong>${estatus.toUpperCase()}</strong>.</p>
                    
                    <h3 style="color: #003366; margin-top: 20px;">Comentarios del departamento:</h3>
                    <p style="background-color: #f4f4f4; padding: 10px; border-left: 4px solid ${colorEstatus};">
                        <em>${comentarios || 'Sin comentarios adicionales.'}</em>
                    </p>
                    <br><br>
                    <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Century Gothic', Arial, sans-serif; margin-top: 20px;">
                      <tr>
                        <td style="padding-right: 15px; border-right: 1px solid #336699; vertical-align: top;">
                          <img src="https://i.ibb.co/0yw9rvv8/LOGO-CANACO.png" alt="CANACO Monterrey" width="110" style="display: block;">
                        </td>
                        <td style="padding-left: 15px; vertical-align: top;">
                          <h3 style="margin: 0; font-size: 16px; color: #000; font-weight: bold;">Departamento de Contabilidad</h3>
                          <p style="margin: 4px 0 15px 0; font-size: 13px; color: #333;">CANACO Monterrey</p>
                          <p style="margin: 0 0 15px 0; font-size: 13px;">
                            <a href="mailto:helpdesk.canacomty@gmail.com" style="color: #0000EE; text-decoration: underline;">helpdesk.canacomty@gmail.com</a><br>
                            <span style="color: #336699;">Tel. (81) 8150 2424</span>
                          </p>
                          <p style="margin: 0; font-size: 13px;">
                            <a href="https://www.canaco.net" style="color: #0000EE; text-decoration: underline;">www.canaco.net</a> 
                            <span style="color: #336699;"> / Canaco Monterrey /</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                    </div>
            `
        };
        transporter.sendMail(mailOptions).catch(err => console.error(err));
    }

    res.json(ticketAct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 4. VOTAR 
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
// 7. BORRAR TICKET (¡CON AVISO DE CANCELACIÓN!)
// ==========================================
const deleteTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticketBorrado = result.rows[0];

    // ==========================================
    // INICIO DE LÓGICA DE CORREO AUTOMÁTICO (BORRAR)
    // ==========================================
    if (ticketBorrado.email_contacto && ticketBorrado.email_contacto.trim() !== '') {
        const mailOptions = {
            from: '"Soporte CANACO" <helpdesk.canacomty@gmail.com>',
            to: ticketBorrado.email_contacto,
            subject: `❌ Reporte Cancelado - Folio #${ticketBorrado.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
                    <h2 style="color: #d9534f;">Aviso de cancelación</h2>
                    <p>Hola <strong>${ticketBorrado.nombre_contacto || 'colaborador'}</strong>,</p>
                    <p>Te informamos que tu ticket con folio <strong>#${ticketBorrado.id}</strong> ha sido cancelado o eliminado del sistema.</p>
                    <p>Si consideras que esto es un error, por favor comunícate con nosotros.</p>
                    <br><br>
                    <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Century Gothic', Arial, sans-serif; margin-top: 20px;">
                      <tr>
                        <td style="padding-right: 15px; border-right: 1px solid #336699; vertical-align: top;">
                          <img src="https://i.ibb.co/0yw9rvv8/LOGO-CANACO.png" alt="CANACO Monterrey" width="110" style="display: block;">
                        </td>
                        <td style="padding-left: 15px; vertical-align: top;">
                          <h3 style="margin: 0; font-size: 16px; color: #000; font-weight: bold;">Departamento de Contabilidad</h3>
                          <p style="margin: 4px 0 15px 0; font-size: 13px; color: #333;">CANACO Monterrey</p>
                          <p style="margin: 0 0 15px 0; font-size: 13px;">
                            <a href="mailto:helpdesk.canacomty@gmail.com" style="color: #0000EE; text-decoration: underline;">helpdesk.canacomty@gmail.com</a><br>
                            <span style="color: #336699;">Tel. (81) 8150 2424</span>
                          </p>
                          <p style="margin: 0; font-size: 13px;">
                            <a href="https://www.canaco.net" style="color: #0000EE; text-decoration: underline;">www.canaco.net</a> 
                            <span style="color: #336699;"> / Canaco Monterrey /</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                    </div>
            `
        };
        transporter.sendMail(mailOptions).catch(err => console.error(err));
    }

    res.json({ message: 'Ticket eliminado correctamente', ticket: ticketBorrado });
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