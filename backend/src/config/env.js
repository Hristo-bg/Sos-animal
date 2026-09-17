require('dotenv').config();
const path = require('path');

const PORT = process.env.PORT || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const DISPATCH_WEBHOOK_URL = process.env.DISPATCH_WEBHOOK_URL || null;

const backendRoot = path.join(__dirname, '..', '..');
const uploadsDir = path.join(backendRoot, 'uploads');
const dataDirectory = path.join(
  process.env.APPDATA || path.join(backendRoot, 'data'),
  'SOS Animal'
);
const databaseFile = path.join(dataDirectory, 'sos-animal.sqlite');

module.exports = {
  PORT,
  JWT_SECRET,
  DISPATCH_WEBHOOK_URL,
  uploadsDir,
  dataDirectory,
  databaseFile,
};
