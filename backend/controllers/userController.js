const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { createId, userRow } = require('../utils/sqlHelpers');
const { logAction } = require('../services/auditService');

const findUserById = async (id, includePassword = false) => {
  const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return userRow(users[0], includePassword);
};

const redactPassword = (user) => user && { ...user, password: '[REDACTED]' };

const getAllUsers = async (req, res) => {
  try {
    const users = await query('SELECT * FROM users ORDER BY name ASC');
    res.json(users.map((user) => userRow(user)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await findUserById(req.params.id, true);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextIsActive = !user.isActive;
    await query('UPDATE users SET is_active = ? WHERE id = ?', [nextIsActive ? 1 : 0, req.params.id]);

    const updatedUser = await findUserById(req.params.id, true);
    await logAction(req.user.id, 'users', 'UPDATE', updatedUser._id, redactPassword(user), redactPassword(updatedUser));

    res.json(userRow({
      ...updatedUser,
      is_active: updatedUser.isActive ? 1 : 0,
      created_at: updatedUser.createdAt,
      updated_at: updatedUser.updatedAt
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive, permissions } = req.body;

    const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = createId();

    await query(
      'INSERT INTO users (id, name, email, password, role, is_active, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        email,
        hashedPassword,
        role || 'staff',
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        JSON.stringify(permissions || [])
      ]
    );

    const user = await findUserById(id, true);
    await logAction(req.user.id, 'users', 'CREATE', user._id, null, redactPassword(user));

    const { password: _password, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await findUserById(req.params.id, true);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {
      name: req.body.name || user.name,
      email: req.body.email || user.email,
      role: req.body.role || user.role,
      is_active: req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : (user.isActive ? 1 : 0),
      permissions: JSON.stringify(req.body.permissions !== undefined ? req.body.permissions : user.permissions)
    };

    let passwordSql = '';
    const params = [updates.name, updates.email, updates.role, updates.is_active, updates.permissions];

    if (req.body.password) {
      passwordSql = ', password = ?';
      params.push(await bcrypt.hash(req.body.password, 10));
    }

    params.push(req.params.id);

    await query(
      `UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, permissions = ?${passwordSql} WHERE id = ?`,
      params
    );

    const updatedUser = await findUserById(req.params.id, true);
    await logAction(req.user.id, 'users', 'UPDATE', updatedUser._id, redactPassword(user), redactPassword(updatedUser));

    const { password: _password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, toggleUserStatus, createUser, updateUser };
