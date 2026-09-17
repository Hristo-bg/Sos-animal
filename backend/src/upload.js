const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadsDir } = require('./config/env');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `incident-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

module.exports = multer({ storage });
