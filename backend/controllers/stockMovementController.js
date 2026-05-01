const { query, transaction } = require('../config/db');
const { createId, movementRow } = require('../utils/sqlHelpers');

const movementSelect = `
  SELECT
    sm.*,
    p.name AS product_name,
    p.sku AS product_sku,
    u.name AS user_name,
    u.email AS user_email
  FROM stock_movements sm
  LEFT JOIN products p ON p.id = sm.product_id
  LEFT JOIN users u ON u.id = sm.performed_by
`;

const findMovement = async (id) => {
  const rows = await query(`${movementSelect} WHERE sm.id = ? LIMIT 1`, [id]);
  return movementRow(rows[0]);
};

const recordMovement = async (req, res) => {
  try {
    const { product, type, quantity, reason } = req.body;

    if (!product || !type || quantity === undefined || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let delta = Number(quantity);
    if (type === 'OUT') {
      delta = -Math.abs(delta);
    } else if (type === 'IN') {
      delta = Math.abs(delta);
    } else if (type !== 'ADJUSTMENT') {
      return res.status(400).json({ message: 'Invalid movement type' });
    }

    const movementId = await transaction(async (connection) => {
      const [products] = await connection.execute(
        'SELECT id, current_quantity FROM products WHERE id = ? FOR UPDATE',
        [product]
      );
      const existingProduct = products[0];

      if (!existingProduct) {
        const error = new Error('Product not found');
        error.status = 404;
        throw error;
      }

      if (Number(existingProduct.current_quantity) + delta < 0) {
        const error = new Error('Movement would cause negative stock');
        error.status = 400;
        throw error;
      }

      const id = createId();
      await connection.execute(
        `INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, product, type, delta, reason, req.user.id]
      );

      await connection.execute(
        'UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?',
        [delta, product]
      );

      return id;
    });

    const populatedMovement = await findMovement(movementId);
    res.status(201).json(populatedMovement);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const getMovements = async (req, res) => {
  try {
    const { product, startDate, endDate } = req.query;
    const filters = [];
    const params = [];

    if (product) {
      filters.push('sm.product_id = ?');
      params.push(product);
    }

    if (startDate) {
      filters.push('sm.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      filters.push('sm.created_at <= ?');
      params.push(endDate);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const movements = await query(`${movementSelect} ${where} ORDER BY sm.created_at DESC`, params);

    res.status(200).json(movements.map(movementRow));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  recordMovement,
  getMovements
};
