const { exec } = require('child_process');

// Este script simplemente lanza el comando 'serve' de forma que Windows lo entienda
const cmd = 'npx serve -s dist -l 5173';

const server = exec(cmd, { windowsHide: true });

server.stdout.on('data', (data) => console.log(data));
server.stderr.on('data', (data) => console.error(data));

console.log('Servidor de producción iniciado en el puerto 5173');