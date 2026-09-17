const http = require('http');
const { PORT } = require('./src/config/env');
const app = require('./src/app');
const { initSockets } = require('./src/sockets');
const { startDbRetryLoop } = require('./src/db/state');

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const httpServer = http.createServer(app);
initSockets(httpServer);

httpServer.listen(PORT, () => {
  console.log(`RoadGuardian backend running on http://localhost:${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
  startDbRetryLoop();
});
