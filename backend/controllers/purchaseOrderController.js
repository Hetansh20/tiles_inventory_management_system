const { query, transaction } = require('../config/db');
const { createId, dateOnly, decimal } = require('../utils/sqlHelpers');
const { logAction } = require('../services/auditService');

const orderBaseSelect = `
  SELECT
    po.*,
    s.name AS supplier_name,
    u.name AS created_by_name
  FROM purchase_orders po
  LEFT JOIN suppliers s ON s.id = po.supplier_id
  LEFT JOIN users u ON u.id = po.created_by
`;

const buildOrder = (order, lines) => ({
  _id: order.id,
  id: order.id,
  supplier: order.supplier_id ? {
    _id: order.supplier_id,
    id: order.supplier_id,
    name: order.supplier_name
  } : null,
  status: order.status,
  expectedDeliveryDate: dateOnly(order.expected_delivery_date),
  lines,
  totalAmount: decimal(order.total_amount),
  createdBy: order.created_by ? {
    _id: order.created_by,
    id: order.created_by,
    name: order.created_by_name
  } : null,
  createdAt: order.created_at,
  updatedAt: order.updated_at
});

const lineRow = (row) => ({
  _id: row.id,
  id: row.id,
  product: row.product_id ? {
    _id: row.product_id,
    id: row.product_id,
    name: row.product_name,
    sku: row.product_sku,
    costPrice: decimal(row.product_cost_price)
  } : null,
  orderedQuantity: Number(row.ordered_quantity),
  receivedQuantity: Number(row.received_quantity),
  unitPrice: decimal(row.unit_price)
});

const fetchLinesForOrders = async (orderIds) => {
  if (!orderIds.length) return new Map();

  const placeholders = orderIds.map(() => '?').join(', ');
  const rows = await query(
    `SELECT
       pol.*,
       p.name AS product_name,
       p.sku AS product_sku,
       p.cost_price AS product_cost_price
     FROM purchase_order_lines pol
     LEFT JOIN products p ON p.id = pol.product_id
     WHERE pol.purchase_order_id IN (${placeholders})
     ORDER BY pol.created_at ASC`,
    orderIds
  );

  const linesByOrder = new Map(orderIds.map((id) => [id, []]));
  for (const row of rows) {
    linesByOrder.get(row.purchase_order_id)?.push(lineRow(row));
  }

  return linesByOrder;
};

const fetchOrders = async (where = '', params = []) => {
  const orders = await query(`${orderBaseSelect} ${where} ORDER BY po.created_at DESC`, params);
  const linesByOrder = await fetchLinesForOrders(orders.map((order) => order.id));
  return orders.map((order) => buildOrder(order, linesByOrder.get(order.id) || []));
};

const fetchOrder = async (id) => {
  const orders = await fetchOrders('WHERE po.id = ?', [id]);
  return orders[0] || null;
};

const getOrders = async (req, res) => {
  try {
    const orders = await fetchOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { supplier, status, expectedDeliveryDate, lines, totalAmount } = req.body;

    if (!lines || lines.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one line item' });
    }

    const orderId = await transaction(async (connection) => {
      const id = createId();
      await connection.execute(
        `INSERT INTO purchase_orders (id, supplier_id, status, expected_delivery_date, total_amount, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          supplier,
          status || 'Draft',
          expectedDeliveryDate || null,
          Number(totalAmount || 0),
          req.user.id
        ]
      );

      for (const line of lines) {
        await connection.execute(
          `INSERT INTO purchase_order_lines
             (id, purchase_order_id, product_id, ordered_quantity, received_quantity, unit_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            createId(),
            id,
            line.product,
            Number(line.orderedQuantity),
            0,
            Number(line.unitPrice)
          ]
        );
      }

      return id;
    });

    const populatedOrder = await fetchOrder(orderId);
    await logAction(req.user.id, 'orders', 'CREATE', orderId, null, populatedOrder);

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await fetchOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'Received') {
      return res.status(400).json({ message: 'Cannot update a fully received order' });
    }

    await query('UPDATE purchase_orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);

    const populatedOrder = await fetchOrder(req.params.id);
    await logAction(req.user.id, 'orders', 'UPDATE', order._id, order, populatedOrder);

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const receiveItems = async (req, res) => {
  try {
    const oldState = await fetchOrder(req.params.id);
    if (!oldState) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['Received', 'Cancelled'].includes(oldState.status)) {
      return res.status(400).json({ message: `Cannot receive items for a ${oldState.status} order` });
    }

    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided to receive' });
    }

    await transaction(async (connection) => {
      const [orders] = await connection.execute(
        'SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE',
        [req.params.id]
      );

      if (!orders.length) {
        throw new Error('Order not found');
      }

      const [lines] = await connection.execute(
        'SELECT * FROM purchase_order_lines WHERE purchase_order_id = ? FOR UPDATE',
        [req.params.id]
      );

      let itemsReceivedThisTime = 0;

      for (const item of items) {
        const quantity = Number(item.quantity);
        if (quantity <= 0) continue;

        const line = lines.find((candidate) => candidate.id === item.lineId);
        if (!line) {
          throw new Error(`Line item ${item.lineId} not found in this order`);
        }

        if (Number(line.received_quantity) + quantity > Number(line.ordered_quantity)) {
          throw new Error('Cannot receive more than ordered for line item');
        }

        await connection.execute(
          'UPDATE purchase_order_lines SET received_quantity = received_quantity + ? WHERE id = ?',
          [quantity, line.id]
        );

        const [productResult] = await connection.execute(
          'UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?',
          [quantity, line.product_id]
        );

        if (!productResult.affectedRows) {
          throw new Error(`Product ${line.product_id} not found`);
        }

        await connection.execute(
          `INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by)
           VALUES (?, ?, 'IN', ?, ?, ?)`,
          [createId(), line.product_id, quantity, `PO-${req.params.id} Received`, req.user.id]
        );

        line.received_quantity = Number(line.received_quantity) + quantity;
        itemsReceivedThisTime += quantity;
      }

      if (itemsReceivedThisTime === 0) {
        throw new Error('No valid quantities to receive');
      }

      const allReceived = lines.every((line) => Number(line.received_quantity) >= Number(line.ordered_quantity));
      const anyReceived = lines.some((line) => Number(line.received_quantity) > 0);
      const nextStatus = allReceived ? 'Received' : (anyReceived ? 'Partially Received' : orders[0].status);

      await connection.execute('UPDATE purchase_orders SET status = ? WHERE id = ?', [nextStatus, req.params.id]);
    });

    const populatedOrder = await fetchOrder(req.params.id);
    await logAction(req.user.id, 'orders', 'UPDATE', oldState._id, oldState, populatedOrder);

    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  receiveItems
};
