const bcrypt = require('bcryptjs');
const { state } = require('../db/state');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, handleDbOrServerError } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const { email, password, role = 'reporter' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await state.pool.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
    const token = generateToken({ id: result.insertId, email, role });
    res.json({ token, user: { id: result.insertId, email, role } });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    return handleDbOrServerError(err, res);
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const [rows] = await state.pool.execute('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    return handleDbOrServerError(err, res);
  }
});

const verify = (req, res) => {
  res.json({ valid: true, user: { id: req.user.id, email: req.user.email, role: req.user.role } });
};

module.exports = { register, login, verify };
