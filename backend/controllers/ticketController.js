const pool = require('../config/db'); // Importamos la conexión
const transporter = require('../config/mailer'); // Importamos al cartero de Nodemailer

// 👇 Filtro de seguridad para limpiar textos maliciosos 👇
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = createDOMPurify(window);

// ==========================================
// 1. CREAR TICKET (¡AHORA CON EVIDENCIA Y BITÁCORA!)
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

  // Limpiamos los textos antes de usarlos
  const tituloLimpio = purify.sanitize(titulo);
  const descripcionLimpia = purify.sanitize(descripcion);

  // Si req.file existe, armamos la ruta completa. Si no, lo dejamos como null.
  const rutaEvidencia = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const newTicket = await pool.query(
      // 👇 CORRECCIÓN AQUÍ: Cambiamos 'Abierto' por 'abierto' (todo minúscula) 👇
      `INSERT INTO tickets (titulo, descripcion, categoria, prioridad, ubicacion, usuario_id, nombre_contacto, email_contacto, departamento, estatus, evidencia) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'abierto', $10) RETURNING *`,
      [
        tituloLimpio,
        descripcionLimpia,
        categoria || 'General', 
        prioridad || 'baja', 
        ubicacion, 
        usuario_id || null, 
        nombre_contacto,    
        email_contacto,
        departamento,
        rutaEvidencia 
      ]
    );

    const ticketGuardado = newTicket.rows[0];

    await pool.query(
      `INSERT INTO bitacora_tickets (ticket_id, usuario_id, accion, detalles) VALUES ($1, $2, $3, $4)`,
      [ticketGuardado.id, usuario_id || null, 'CREACIÓN', 'El reporte fue registrado en el sistema.']
    );

    const io = req.app.get('socketio');
    if (io) {
        io.emit('ticket_creado', ticketGuardado);
    }

    const correoAdmin = process.env.ADMIN_EMAIL;
    
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
                        <li style="margin-bottom: 5px;"><strong>Asunto reportado:</strong> ${tituloLimpio}</li>
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

        transporter.sendMail(mailOptions).catch(err => console.error(err));

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
                        <li><strong>Asunto reportado:</strong> ${tituloLimpio} - ${descripcionLimpia}</li>
                    </ul>
                    <p><em>Favor de dar seguimiento presencial o por extensión.</em></p>
                </div>
            `
        };

        transporter.sendMail(mailOptionsAdmin).catch(err => console.error(err));
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
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const { estatus, departamento, fechaInicio, fechaFin } = req.query;

  try {
    if (page && limit) {
      const offset = (page - 1) * limit;
      
      let whereClauses = [];
      let queryParams = [];
      let paramIndex = 1;

      if (estatus && estatus !== 'Todos') {
        whereClauses.push(`t.estatus = $${paramIndex}`);
        queryParams.push(estatus);
        paramIndex++;
      }
      
      if (departamento && departamento !== 'Todos') {
        whereClauses.push(`t.departamento = $${paramIndex}`);
        queryParams.push(departamento);
        paramIndex++;
      }
      
      if (fechaInicio) {
        whereClauses.push(`t.fecha_creacion >= $${paramIndex}`);
        queryParams.push(`${fechaInicio} 00:00:00`);
        paramIndex++;
      }
      
      if (fechaFin) {
        whereClauses.push(`t.fecha_creacion <= $${paramIndex}`);
        queryParams.push(`${fechaFin} 23:59:59`);
        paramIndex++;
      }

      const whereString = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

      const totalQueryStr = `SELECT COUNT(*) FROM tickets t ${whereString}`;
      const totalQuery = await pool.query(totalQueryStr, queryParams);
      const totalTickets = parseInt(totalQuery.rows[0].count);

      const paginatedQueryStr = `
        SELECT 
          t.*, 
          COALESCE(u.nombre, t.nombre_contacto) AS usuario_nombre,
          COALESCE(u.email, t.email_contacto) AS usuario_email,
          tech.nombre AS tecnico_nombre
        FROM tickets t
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        LEFT JOIN usuarios tech ON t.asignado_a = tech.id
        ${whereString}
        ORDER BY t.fecha_creacion DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const paginatedTickets = await pool.query(paginatedQueryStr, [...queryParams, limit, offset]);

      res.json({
        tickets: paginatedTickets.rows,
        total: totalTickets,
        totalPages: Math.ceil(totalTickets / limit),
        currentPage: page
      });

    } else {
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
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor al obtener tickets");
  }
};

// ==========================================
// 3. ACTUALIZAR 
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
    departamento,
    admin_id 
  } = req.body;

  // 👇 NUEVO: Limpiamos textos antes de usarlos 👇
  const tituloLimpio = titulo ? purify.sanitize(titulo) : null;
  const descripcionLimpia = descripcion ? purify.sanitize(descripcion) : null;
  const comentariosLimpios = comentarios ? purify.sanitize(comentarios) : null;

  try {
    const viejoTicketQuery = await pool.query('SELECT estatus, prioridad FROM tickets WHERE id = $1', [id]);
    const viejo = viejoTicketQuery.rows.length > 0 ? viejoTicketQuery.rows[0] : null;

    const result = await pool.query(
      `UPDATE tickets 
       SET titulo = COALESCE($1, titulo),
           descripcion = COALESCE($2, descripcion),
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
        tituloLimpio, descripcionLimpia, ubicacion, categoria, estatus, prioridad, 
        comentariosLimpios, asignado_a, departamento, id            
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const ticketAct = result.rows[0];

    if (viejo) {
        let detallesCambios = [];
        
        if (viejo.estatus !== estatus) {
            detallesCambios.push(`Estatus: ${viejo.estatus.toUpperCase()} ➡️ ${estatus.toUpperCase()}`);
        }
        
        const viejaPrio = viejo.prioridad || 'media';
        const nuevaPrio = prioridad || 'media';
        if (viejaPrio !== nuevaPrio) {
            detallesCambios.push(`Prioridad: ${viejaPrio.toUpperCase()} ➡️ ${nuevaPrio.toUpperCase()}`);
        }

        if (detallesCambios.length > 0) {
            await pool.query(
                `INSERT INTO bitacora_tickets (ticket_id, usuario_id, accion, detalles) VALUES ($1, $2, $3, $4)`,
                [id, admin_id || null, 'ACTUALIZACIÓN', detallesCambios.join(' | ')]
            );
        }
    }

    const io = req.app.get('socketio');
    if (io) {
        io.emit('ticket_actualizado', ticketAct);
    }

    if (ticketAct.email_contacto && ticketAct.email_contacto.trim() !== '') {
        let colorEstatus = "#336699"; 
        let tituloEstatus = "Actualización de tu reporte";
        
        if (estatus.toLowerCase() === 'resuelto') {
            colorEstatus = "#28a745"; 
            tituloEstatus = "¡Tu reporte ha sido resuelto!";
        } else if (estatus.toLowerCase() === 'en proceso') {
            colorEstatus = "#ffc107"; 
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
                        <em>${comentariosLimpios || 'Sin comentarios adicionales.'}</em>
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
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('ticket_actualizado', result.rows[0]);
    }
    
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
  // 1. Recibimos también la ubicación desde el frontend
  const { q, ubicacion } = req.query; 
  
  // 2. Si falta el texto o falta el piso, no buscamos (ahorra recursos)
  if (!q || q.trim() === '' || !ubicacion) return res.json([]);
  
  try {
    // Mantenemos tu limpieza de seguridad intacta 👇
    const searchLimpia = purify.sanitize(q);
    
    // 3. Lógica de separación de palabras
    // Ignoramos palabras de 1 o 2 letras, y hacemos una lista negra para excepciones de 3 letras
    const palabrasIgnoradas = ['con', 'del', 'las', 'los', 'por', 'que'];
    const palabras = searchLimpia.split(' ').filter(p => 
        p.length >= 3 && !palabrasIgnoradas.includes(p.toLowerCase())
    );

    // Si el usuario solo escribió "el la de", no buscamos nada
    if (palabras.length === 0) return res.json([]);

    // 4. Construcción de la consulta dinámica
    const querySQL = `
      SELECT t.*, u.nombre as usuario_nombre 
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      WHERE t.ubicacion = $1 
      AND (${palabras.map((_, i) => `t.titulo ILIKE $${i + 2}`).join(' OR ')})
      AND t.estatus != 'resuelto' 
      LIMIT 3
    `;

    // 5. Inyectamos los valores: [ubicacion, %palabra1%, %palabra2%...]
    const values = [ubicacion, ...palabras.map(p => `%${p}%`)];

    const result = await pool.query(querySQL, values);
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
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticketBorrado = result.rows[0];

    const io = req.app.get('socketio');
    if (io) {
        io.emit('ticket_eliminado', id);
    }

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

// ==========================================
// 8. OBTENER BITÁCORA DEL TICKET 
// ==========================================
const getTicketBitacora = async (req, res) => {
    const { id } = req.params;
    try {
        const bitacora = await pool.query(`
            SELECT b.*, u.nombre as usuario_nombre 
            FROM bitacora_tickets b 
            LEFT JOIN usuarios u ON b.usuario_id = u.id 
            WHERE b.ticket_id = $1 
            ORDER BY b.fecha DESC
        `, [id]);
        
        res.json(bitacora.rows);
    } catch (error) {
        console.error("Error al cargar bitácora:", error);
        res.status(500).json({ error: "Error al obtener el historial de cambios" });
    }
};

module.exports = {
  createTicket,
  getAllTickets,
  updateTicket,
  voteTicket,
  searchTickets,
  getUserVotes,
  deleteTicket,
  getTicketBitacora 
};