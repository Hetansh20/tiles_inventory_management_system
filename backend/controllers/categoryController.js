const { query } = require('../config/db');
const { categoryRow, createId } = require('../utils/sqlHelpers');
const { logAction } = require('../services/auditService');

const findCategory = async (id) => {
  const rows = await query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
  return categoryRow(rows[0]);
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories.map(categoryRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching categories', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingCategories = await query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
    if (existingCategories.length) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const id = createId();
    await query(
      'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
      [id, name, description || '']
    );

    const category = await findCategory(id);
    await logAction(req.user.id, 'categories', 'CREATE', category._id, null, category);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating category', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    if (name) {
      const existingCategories = await query(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1',
        [name, categoryId]
      );
      if (existingCategories.length) {
        return res.status(400).json({ message: 'Another category with this name already exists' });
      }
    }

    const oldCategory = await findCategory(categoryId);
    if (!oldCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name || oldCategory.name, description !== undefined ? description : oldCategory.description, categoryId]
    );

    const category = await findCategory(categoryId);
    await logAction(req.user.id, 'categories', 'UPDATE', category._id, oldCategory, category);

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await findCategory(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    await logAction(req.user.id, 'categories', 'DELETE', category._id, category, null);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting category', error: error.message });
  }
};
