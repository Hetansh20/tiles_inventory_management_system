const { query } = require('../config/db');
const { createId, supplierRow } = require('../utils/sqlHelpers');
const { logAction } = require('../services/auditService');

const findSupplier = async (id) => {
  const rows = await query('SELECT * FROM suppliers WHERE id = ? LIMIT 1', [id]);
  return supplierRow(rows[0]);
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(suppliers.map(supplierRow));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, isActive } = req.body;

    const existing = await query('SELECT id FROM suppliers WHERE name = ? LIMIT 1', [name]);
    if (existing.length) {
      return res.status(400).json({ message: 'Supplier with this name already exists' });
    }

    const id = createId();
    await query(
      `INSERT INTO suppliers (id, name, contact_person, email, phone, address, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        contactPerson || '',
        email || '',
        phone || '',
        address || '',
        isActive !== undefined ? (isActive ? 1 : 0) : 1
      ]
    );

    const supplier = await findSupplier(id);
    await logAction(req.user.id, 'suppliers', 'CREATE', supplier._id, null, supplier);

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await findSupplier(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await query(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, is_active = ?
       WHERE id = ?`,
      [
        req.body.name || supplier.name,
        req.body.contactPerson || supplier.contactPerson,
        req.body.email || supplier.email,
        req.body.phone || supplier.phone,
        req.body.address || supplier.address,
        req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : (supplier.isActive ? 1 : 0),
        req.params.id
      ]
    );

    const updated = await findSupplier(req.params.id);
    await logAction(req.user.id, 'suppliers', 'UPDATE', updated._id, supplier, updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await findSupplier(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [req.params.id]);
    const updated = await findSupplier(req.params.id);

    await logAction(req.user.id, 'suppliers', 'DELETE', supplier._id, supplier, updated);

    res.json({ message: 'Supplier deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
