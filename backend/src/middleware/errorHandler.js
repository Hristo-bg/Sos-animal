const { markOffline, isDbConnectionError, DB_OFFLINE_RESPONSE } = require('../db/state');

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function handleDbOrServerError(err, res) {
  if (isDbConnectionError(err)) {
    markOffline();
    return res.status(503).json(DB_OFFLINE_RESPONSE);
  }
  return res.status(500).json({ error: err?.message || 'Server error' });
}

function errorHandler(err, req, res, next) {
  console.error('API error:', err);
  if (isDbConnectionError(err)) {
    markOffline();
    return res.status(503).json(DB_OFFLINE_RESPONSE);
  }
  res.status(500).json({ error: err?.message || 'Server error' });
}

module.exports = { asyncHandler, handleDbOrServerError, errorHandler };
