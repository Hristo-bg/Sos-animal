const { connectDbOnce, isDbConnectionError } = require('./adapter');

const DB_OFFLINE_RESPONSE = {
  status: 'error',
  code: 'DB_OFFLINE',
  message: 'Базата данни не е активна.',
};

const state = {
  pool: null,
  online: false,
};

async function startDbRetryLoop() {
  try {
    state.pool = await connectDbOnce();
    state.online = true;
    console.log('Embedded database ready');
  } catch (err) {
    state.online = false;
    console.error('Embedded database failed:', err?.message || err);
  }
}

function markOffline() {
  state.online = false;
}

function requireDb(req, res, next) {
  if (!state.online || !state.pool) return res.status(503).json(DB_OFFLINE_RESPONSE);
  next();
}

module.exports = { state, startDbRetryLoop, markOffline, requireDb, isDbConnectionError, DB_OFFLINE_RESPONSE };
