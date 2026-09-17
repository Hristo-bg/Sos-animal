const { Server: SocketServer } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

let io = null;

function initSockets(httpServer) {
  io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing token'));
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err || !['admin', 'org'].includes(user?.role)) return next(new Error('Invalid admin token'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    socket.emit('connection.ready', { userId: socket.user.id });
  });

  return io;
}

function broadcastIncident(event, payload) {
  io?.emit(event, payload);
}

module.exports = { initSockets, broadcastIncident };
