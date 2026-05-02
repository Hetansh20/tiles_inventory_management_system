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

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
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
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();

    console.log(`Login attempt for identifier: "${identifier}"`);

    if (!identifier || !password) {
      console.log('Login failed: Missing identifier or password');
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const users = await query(
      'SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1',
      [identifier, identifier]
    );
    const user = userRow(users[0], true);
    if (!user) {
      console.log(`Login failed: No user found for identifier "${identifier}"`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log(`Login failed: Account deactivated for "${identifier}"`);
      return res.status(403).json({ message: 'Account deactivated by an administrator' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for "${identifier}"`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`Login successful for user: ${user.email} (ID: ${user.id})`);

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
