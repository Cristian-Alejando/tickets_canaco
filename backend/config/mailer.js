const nodemailer = require('nodemailer');
require('dotenv').config();

// Creamos el "cartero" robótico con los datos de Gmail
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true para el puerto 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verificamos que la conexión funcione correctamente
transporter.verify().then(() => {
    console.log('✉️  Cartero Nodemailer listo y conectado a Gmail');
}).catch((error) => {
    console.error('❌ Error configurando el cartero:', error);
});

module.exports = transporter;