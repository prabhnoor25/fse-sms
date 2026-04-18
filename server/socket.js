const { Server } = require('socket.io');
let io;

function init(server) {
  if (io) return io;
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
  });
  return io;
}

function getIo() { return io; }

module.exports = { init, getIo };
