const { query } = require('../config/db');
const { createId, warehouseRow } = require('../utils/sqlHelpers');

const findWarehouse = async (id) => {
  const rows = await query('SELECT * FROM warehouses WHERE id = ? LIMIT 1', [id]);
  return warehouseRow(rows[0]);
};

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await query('SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name ASC');
    res.json(warehouses.map(warehouseRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching warehouses', error: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const { name, location, contactPerson, contactNumber } = req.body;

    const existing = await query('SELECT id FROM warehouses WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
    if (existing.length) {
      return res.status(400).json({ message: 'Warehouse with this name already exists' });
    }

    const id = createId();
    await query(
      `INSERT INTO warehouses (id, name, location, contact_person, contact_number)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, location, contactPerson, contactNumber]
    );

    const warehouse = await findWarehouse(id);
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating warehouse', error: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const { name, location, contactPerson, contactNumber } = req.body;
    const warehouseId = req.params.id;

    if (name) {
      const existing = await query(
        'SELECT id FROM warehouses WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1',
        [name, warehouseId]
      );
      if (existing.length) {
        return res.status(400).json({ message: 'Another warehouse with this name already exists' });
      }
    }

    const oldWarehouse = await findWarehouse(warehouseId);
    if (!oldWarehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    await query(
      `UPDATE warehouses
       SET name = ?, location = ?, contact_person = ?, contact_number = ?
       WHERE id = ?`,
      [
        name || oldWarehouse.name,
        location || oldWarehouse.location,
        contactPerson || oldWarehouse.contactPerson,
        contactNumber || oldWarehouse.contactNumber,
        warehouseId
      ]
    );

    const warehouse = await findWarehouse(warehouseId);
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating warehouse', error: error.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await findWarehouse(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    await query('UPDATE warehouses SET is_active = 0 WHERE id = ?', [req.params.id]);

    res.json({ message: 'Warehouse soft-deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting warehouse', error: error.message });
  }
};
