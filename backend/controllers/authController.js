const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { createId, userRow } = require('../utils/sqlHelpers');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = createId();

    await query(
      'INSERT INTO users (id, name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, role || 'staff', JSON.stringify([])]
    );

    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json({ message: 'User created successfully', user: userRow(users[0]) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = userRow(users[0], true);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated by an administrator' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };
