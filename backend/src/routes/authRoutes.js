const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireDb } = require('../db/state');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', requireDb, authController.register);
router.post('/login', requireDb, authController.login);
router.post('/verify', authenticateToken, authController.verify);

module.exports = router;
