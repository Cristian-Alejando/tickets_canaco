const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

// Este middleware revisa que el usuario traiga un token válido
const verifyToken = async (req, res, next) => {
    // 1. Buscamos el gafete en la cabecera 'Authorization' (Bearer Token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token de autenticación.' });
    }

    // 2. Extraemos el token puro
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verificamos si es falso o ya caducó
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // 4. Vamos a la base de datos a ver quién es este usuario y si tiene permiso
        const result = await pool.query('SELECT id, rol, activo FROM usuarios WHERE id = $1', [decoded.id]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'El usuario del token ya no existe.' });
        }

        const usuario = result.rows[0];

        if (!usuario.activo) {
            return res.status(403).json({ error: 'Tu cuenta ha sido desactivada.' });
        }

        // 5. Pegamos la información del usuario a la petición (req) para que los controladores la puedan usar
        req.usuario = usuario;
        
        // 6. ¡Pásale!
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' });
        }
        return res.status(401).json({ error: 'Token inválido o manipulado.' });
    }
};

// Este middleware revisa que el usuario (ya verificado) tenga rango de Admin
const requireAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de Administrador.' });
    }
    next();
};

// Este middleware permite pasar a Admins y Técnicos
const requireAdminOrTech = (req, res, next) => {
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'tecnico') {
        return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }
    next();
};

module.exports = {
    verifyToken,
    requireAdmin,
    requireAdminOrTech
};