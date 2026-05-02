const { query, transaction } = require('../config/db');
const { createId, inventoryRow } = require('../utils/sqlHelpers');
const { logAction } = require('../services/auditService');

// ===== QUERIES =====

const inventorySelect = `
  SELECT
    ps.id,
    ps.product_id,
    ps.warehouse_id,
    ps.quantity,
    ps.created_at,
    ps.updated_at,
    p.name AS product_name,
    p.sku AS product_sku,
    p.image_url AS product_image,
    p.size AS product_size,
    p.category_id,
    p.unit_of_measure,
    p.cost_price,
    p.low_stock_threshold,
    p.current_quantity AS total_quantity,
    w.name AS warehouse_name,
    w.location AS warehouse_location,
    c.name AS category_name
  FROM product_stocks ps
  LEFT JOIN products p ON p.id = ps.product_id
  LEFT JOIN warehouses w ON w.id = ps.warehouse_id
  LEFT JOIN categories c ON c.id = p.category_id
`;

// ===== HELPER FUNCTIONS =====

const findInventory = async (id) => {
  const rows = await query(`${inventorySelect} WHERE ps.id = ? LIMIT 1`, [id]);
  return inventoryRow(rows[0]);
};

const getWarehouseInventory = async (warehouseId) => {
  return await query(`${inventorySelect} WHERE ps.warehouse_id = ? ORDER BY p.name ASC`, [warehouseId]);
};

const getProductInventory = async (productId) => {
  return await query(`${inventorySelect} WHERE ps.product_id = ? ORDER BY w.name ASC`, [productId]);
};

// ===== GET OPERATIONS =====

exports.getAllInventory = async (req, res) => {
  try {
    const { warehouse, product, status } = req.query;
    let sql = inventorySelect;
    const params = [];

    if (warehouse) {
      sql += ' WHERE ps.warehouse_id = ?';
      params.push(warehouse);

      if (product) {
        sql += ' AND ps.product_id = ?';
        params.push(product);
      }
    } else if (product) {
      sql += ' WHERE ps.product_id = ?';
      params.push(product);
    }

    // Low stock filter
    if (status === 'low-stock') {
      sql += params.length ? ' AND ps.quantity <= p.low_stock_threshold' : ' WHERE ps.quantity <= p.low_stock_threshold';
    } else if (status === 'out-of-stock') {
      sql += params.length ? ' AND ps.quantity = 0' : ' WHERE ps.quantity = 0';
    } else if (status === 'critical') {
      sql += params.length ? ' AND ps.quantity < 5' : ' WHERE ps.quantity < 5';
    }

    sql += ' ORDER BY p.name ASC, w.name ASC';

    const inventories = await query(sql, params);
    res.json(inventories.map(inventoryRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching inventory', error: error.message });
  }
};

exports.getInventoryByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const inventories = await getWarehouseInventory(warehouseId);
    res.json(inventories.map(inventoryRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching warehouse inventory', error: error.message });
  }
};

exports.getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const inventories = await getProductInventory(productId);
    res.json(inventories.map(inventoryRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching product inventory', error: error.message });
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    let sql = `
      SELECT ps.*, p.name, p.sku, p.low_stock_threshold, p.cost_price, 
             w.name as warehouse_name, c.name as category_name
      FROM product_stocks ps
      JOIN products p ON p.id = ps.product_id
      JOIN warehouses w ON w.id = ps.warehouse_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ps.quantity <= p.low_stock_threshold
    `;
    const params = [];

    if (warehouseId) {
      sql += ' AND ps.warehouse_id = ?';
      params.push(warehouseId);
    }

    sql += ' ORDER BY ps.quantity ASC';

    const items = await query(sql, params);
    res.json(items.map(row => ({
      inventoryId: row.id,
      productId: row.product_id,
      productName: row.name,
      sku: row.sku,
      currentStock: row.quantity,
      threshold: row.low_stock_threshold,
      costPrice: row.cost_price,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      categoryName: row.category_name
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching low stock items', error: error.message });
  }
};

exports.getInventorySummary = async (req, res) => {
  try {
    const summary = await query(`
      SELECT
        COUNT(DISTINCT ps.product_id) as total_products,
        COUNT(DISTINCT ps.warehouse_id) as total_warehouses,
        SUM(ps.quantity) as total_quantity,
        SUM(ps.quantity * p.cost_price) as total_value,
        COUNT(CASE WHEN ps.quantity = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN ps.quantity <= p.low_stock_threshold THEN 1 END) as low_stock_count,
        AVG(ps.quantity) as avg_quantity_per_location
      FROM product_stocks ps
      JOIN products p ON p.id = ps.product_id
      WHERE p.is_active = 1
    `);

    res.json({
      totalProducts: Number(summary[0].total_products),
      totalWarehouses: Number(summary[0].total_warehouses),
      totalQuantity: Number(summary[0].total_quantity),
      totalValue: Number(summary[0].total_value || 0),
      outOfStockCount: Number(summary[0].out_of_stock_count),
      lowStockCount: Number(summary[0].low_stock_count),
      avgQuantityPerLocation: Number(summary[0].avg_quantity_per_location || 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching inventory summary', error: error.message });
  }
};

// ===== CREATE/UPDATE OPERATIONS =====

exports.createInventory = async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    if (!productId || !warehouseId || quantity === undefined) {
      return res.status(400).json({ message: 'Please provide productId, warehouseId, and quantity' });
    }

    // Check if product and warehouse exist
    const products = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
    if (!products.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const warehouses = await query('SELECT id FROM warehouses WHERE id = ? LIMIT 1', [warehouseId]);
    if (!warehouses.length) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Check if inventory entry already exists
    const existing = await query(
      'SELECT id FROM product_stocks WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
      [productId, warehouseId]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Inventory entry already exists for this product-warehouse combination' });
    }

    const inventoryId = await transaction(async (connection) => {
      const id = createId();
      await connection.execute(
        'INSERT INTO product_stocks (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)',
        [id, productId, warehouseId, Number(quantity)]
      );

      // Update global product quantity
      await connection.execute(
        'UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?',
        [Number(quantity), productId]
      );

      return id;
    });

    const inventory = await findInventory(inventoryId);
    await logAction(req.user.id, 'inventory', 'CREATE', inventoryId, null, inventory);

    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating inventory', error: error.message });
  }
};

exports.updateInventoryQuantity = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { quantity, reason } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const oldInventory = await findInventory(inventoryId);
    if (!oldInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const quantityDiff = Number(quantity) - oldInventory.quantity;

    const updatedInventory = await transaction(async (connection) => {
      // Update warehouse stock
      await connection.execute(
        'UPDATE product_stocks SET quantity = ? WHERE id = ?',
        [Number(quantity), inventoryId]
      );

      // Update global product quantity
      await connection.execute(
        'UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?',
        [quantityDiff, oldInventory.productId]
      );

      // Record movement
      if (quantityDiff !== 0) {
        const movementId = createId();
        const movementType = quantityDiff > 0 ? 'IN' : 'OUT';
        const movementReason = reason || `Inventory adjustment (${oldInventory.warehouseName})`;
        
        await connection.execute(
          `INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [movementId, oldInventory.productId, movementType, Math.abs(quantityDiff), movementReason, req.user.id]
        );
      }

      return await findInventory(inventoryId);
    });

    await logAction(req.user.id, 'inventory', 'UPDATE', inventoryId, oldInventory, updatedInventory);

    res.json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating inventory', error: error.message });
  }
};

exports.adjustInventory = async (req, res) => {
  try {
    const { inventoryId, adjustmentQuantity, reason } = req.body;

    if (!inventoryId || adjustmentQuantity === undefined || !reason) {
      return res.status(400).json({ message: 'Please provide inventoryId, adjustmentQuantity, and reason' });
    }

    const oldInventory = await findInventory(inventoryId);
    if (!oldInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const newQuantity = oldInventory.quantity + Number(adjustmentQuantity);

    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Adjustment would result in negative stock' });
    }

    const updatedInventory = await transaction(async (connection) => {
      // Update warehouse stock
      await connection.execute(
        'UPDATE product_stocks SET quantity = ? WHERE id = ?',
        [newQuantity, inventoryId]
      );

      // Update global product quantity
      await connection.execute(
        'UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?',
        [Number(adjustmentQuantity), oldInventory.productId]
      );

      // Record movement
      const movementId = createId();
      await connection.execute(
        `INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [movementId, oldInventory.productId, 'ADJUSTMENT', Math.abs(adjustmentQuantity), reason, req.user.id]
      );

      return await findInventory(inventoryId);
    });

    await logAction(req.user.id, 'inventory', 'UPDATE', inventoryId, oldInventory, updatedInventory);

    res.json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error adjusting inventory', error: error.message });
  }
};

// ===== TRANSFER OPERATIONS =====

exports.transferStock = async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = req.body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ message: 'Source and destination warehouses must be different' });
    }

    const result = await transaction(async (connection) => {
      // Get source inventory
      const sourceRows = await connection.execute(
        'SELECT * FROM product_stocks WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
        [productId, fromWarehouseId]
      );
      const sourceInventory = sourceRows[0][0];

      if (!sourceInventory) {
        const error = new Error('Source inventory not found');
        error.status = 404;
        throw error;
      }

      if (sourceInventory.quantity < quantity) {
        const error = new Error('Insufficient stock at source warehouse');
        error.status = 400;
        throw error;
      }

      // Get or create destination inventory
      const destRows = await connection.execute(
        'SELECT * FROM product_stocks WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
        [productId, toWarehouseId]
      );
      let destInventoryId = destRows[0][0]?.id;

      if (!destInventoryId) {
        destInventoryId = createId();
        await connection.execute(
          'INSERT INTO product_stocks (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)',
          [destInventoryId, productId, toWarehouseId, 0]
        );
      }

      // Update quantities
      await connection.execute(
        'UPDATE product_stocks SET quantity = quantity - ? WHERE id = ?',
        [quantity, sourceInventory.id]
      );

      await connection.execute(
        'UPDATE product_stocks SET quantity = quantity + ? WHERE id = ?',
        [quantity, destInventoryId]
      );

      // Record movements
      const outMovementId = createId();
      await connection.execute(
        `INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [outMovementId, productId, 'OUT', quantity, `Transfer OUT: ${reason}`, req.user.id]
      );

      const inMovementId = createId();
      await connection.execute(
        `INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [inMovementId, productId, 'IN', quantity, `Transfer IN: ${reason}`, req.user.id]
      );

      return { sourceInventoryId: sourceInventory.id, destInventoryId };
    });

    const sourceInventory = await findInventory(result.sourceInventoryId);
    const destInventory = await findInventory(result.destInventoryId);

    res.status(201).json({
      message: 'Transfer completed successfully',
      source: sourceInventory,
      destination: destInventory
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// ===== REPORTS =====

exports.getInventoryReport = async (req, res) => {
  try {
    const { startDate, endDate, warehouseId } = req.query;

    let sql = `
      SELECT
        p.id,
        p.name,
        p.sku,
        c.name as category_name,
        SUM(ps.quantity) as total_stock,
        p.cost_price,
        SUM(ps.quantity * p.cost_price) as total_value,
        COUNT(DISTINCT ps.warehouse_id) as warehouse_count,
        COUNT(CASE WHEN ps.quantity = 0 THEN 1 END) as empty_locations,
        p.low_stock_threshold,
        COUNT(CASE WHEN ps.quantity <= p.low_stock_threshold THEN 1 END) as low_stock_locations
      FROM products p
      LEFT JOIN product_stocks ps ON ps.product_id = p.id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
    `;

    const params = [];

    if (warehouseId) {
      sql += ' AND (ps.warehouse_id = ? OR ps.id IS NULL)';
      params.push(warehouseId);
    }

    sql += `
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

    const report = await query(sql, params);

    res.json(report.map(row => ({
      productId: row.id,
      productName: row.name,
      sku: row.sku,
      categoryName: row.category_name,
      totalStock: Number(row.total_stock || 0),
      costPrice: Number(row.cost_price),
      totalValue: Number(row.total_value || 0),
      warehouseCount: Number(row.warehouse_count || 0),
      emptyLocations: Number(row.empty_locations || 0),
      lowStockThreshold: Number(row.low_stock_threshold),
      lowStockLocations: Number(row.low_stock_locations || 0)
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching inventory report', error: error.message });
  }
};

// ===== BATCH OPERATIONS =====

exports.batchUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { inventoryId, quantity }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required and must not be empty' });
    }

    const results = await transaction(async (connection) => {
      const updated = [];

      for (const update of updates) {
        const { inventoryId, quantity } = update;

        const inventoryRows = await connection.execute(
          'SELECT * FROM product_stocks WHERE id = ? LIMIT 1',
          [inventoryId]
        );
        const inventory = inventoryRows[0][0];

        if (!inventory) {
          updated.push({ inventoryId, success: false, message: 'Not found' });
          continue;
        }

        const quantityDiff = Number(quantity) - inventory.quantity;

        await connection.execute(
          'UPDATE product_stocks SET quantity = ? WHERE id = ?',
          [Number(quantity), inventoryId]
        );

        await connection.execute(
          'UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?',
          [quantityDiff, inventory.product_id]
        );

        updated.push({ inventoryId, success: true, newQuantity: Number(quantity) });
      }

      return updated;
    });

    res.json({ message: 'Batch update completed', results });
  } catch (error) {
    res.status(500).json({ message: 'Server error in batch update', error: error.message });
  }
};

exports.exportInventory = async (req, res) => {
  try {
    const { warehouseId, format } = req.query;

    let sql = `
      SELECT
        p.name,
        p.sku,
        c.name as category,
        p.unit_of_measure,
        w.name as warehouse,
        ps.quantity,
        p.cost_price,
        (ps.quantity * p.cost_price) as total_value,
        p.low_stock_threshold,
        CASE WHEN ps.quantity <= p.low_stock_threshold THEN 'Low' ELSE 'OK' END as status
      FROM product_stocks ps
      JOIN products p ON p.id = ps.product_id
      JOIN warehouses w ON w.id = ps.warehouse_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
    `;

    const params = [];

    if (warehouseId) {
      sql += ' AND ps.warehouse_id = ?';
      params.push(warehouseId);
    }

    sql += ' ORDER BY p.name, w.name';

    const data = await query(sql, params);

    if (format === 'csv') {
      const csv = [
        ['Product Name', 'SKU', 'Category', 'Unit', 'Warehouse', 'Quantity', 'Cost Price', 'Total Value', 'Low Stock Threshold', 'Status'].join(','),
        ...data.map(row => [
          row.name,
          row.sku,
          row.category || '',
          row.unit_of_measure,
          row.warehouse,
          row.quantity,
          row.cost_price,
          row.total_value,
          row.low_stock_threshold,
          row.status
        ].map(v => `"${v}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting inventory', error: error.message });
  }
};
