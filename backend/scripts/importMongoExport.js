require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { connectDB, getPool } = require('../config/db');

const DEFAULT_EXPORT_DIR = '/home/ghost/Downloads';
const EXPORT_PREFIX = 'sanitary_ware_inventory';

const files = {
  users: 'users',
  categories: 'categories',
  suppliers: 'suppliers',
  products: 'products',
  purchaseOrders: 'purchaseorders',
  stockMovements: 'stockmovements',
  auditLogs: 'auditlogs'
};

const collectionPath = (exportDir, collection) => (
  path.join(exportDir, `${EXPORT_PREFIX}.${files[collection]}.json`)
);

const readCollection = async (exportDir, collection) => {
  const filePath = collectionPath(exportDir, collection);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`[skip] ${filePath} not found`);
      return [];
    }
    throw error;
  }
};

const oid = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.$oid) return value.$oid;
  if (value._id) return oid(value._id);
  return String(value);
};

const mysqlDateTime = (value) => {
  if (!value) return null;
  const raw = value.$date?.$numberLong ? Number(value.$date.$numberLong) : (value.$date || value);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const mysqlDate = (value) => {
  const dateTime = mysqlDateTime(value);
  return dateTime ? dateTime.slice(0, 10) : null;
};

const json = (value, fallback = null) => JSON.stringify(value === undefined ? fallback : value);

const bool = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback ? 1 : 0;
  return value ? 1 : 0;
};

const normalizeJsonValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }

  if (value && typeof value === 'object') {
    if (value.$oid) return value.$oid;
    if (value.$date) return mysqlDateTime(value);
    if (value.$numberInt) return Number(value.$numberInt);
    if (value.$numberLong) return Number(value.$numberLong);
    if (value.$numberDouble) return Number(value.$numberDouble);

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '__v')
        .map(([key, nested]) => [key, normalizeJsonValue(nested)])
    );
  }

  return value;
};

const executeMany = async (connection, sql, rows) => {
  for (const params of rows) {
    await connection.execute(sql, params);
  }
};

const importUsers = async (connection, users) => {
  await executeMany(connection, `
    INSERT INTO users (id, name, email, password, role, is_active, permissions, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      email = VALUES(email),
      password = VALUES(password),
      role = VALUES(role),
      is_active = VALUES(is_active),
      permissions = VALUES(permissions),
      updated_at = VALUES(updated_at)
  `, users.map((user) => [
    oid(user._id),
    user.name,
    user.email,
    user.password,
    user.role || 'staff',
    bool(user.isActive, true),
    json(user.permissions || []),
    mysqlDateTime(user.createdAt),
    mysqlDateTime(user.updatedAt)
  ]));

  return users.length;
};

const importCategories = async (connection, categories) => {
  await executeMany(connection, `
    INSERT INTO categories (id, name, description, created_at, updated_at)
    VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      updated_at = VALUES(updated_at)
  `, categories.map((category) => [
    oid(category._id),
    category.name,
    category.description || '',
    mysqlDateTime(category.createdAt),
    mysqlDateTime(category.updatedAt)
  ]));

  return categories.length;
};

const importSuppliers = async (connection, suppliers) => {
  await executeMany(connection, `
    INSERT INTO suppliers (id, name, contact_person, email, phone, address, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      contact_person = VALUES(contact_person),
      email = VALUES(email),
      phone = VALUES(phone),
      address = VALUES(address),
      is_active = VALUES(is_active),
      updated_at = VALUES(updated_at)
  `, suppliers.map((supplier) => [
    oid(supplier._id),
    supplier.name,
    supplier.contactPerson || '',
    supplier.email || '',
    supplier.phone || '',
    supplier.address || '',
    bool(supplier.isActive, true),
    mysqlDateTime(supplier.createdAt),
    mysqlDateTime(supplier.updatedAt)
  ]));

  return suppliers.length;
};

const importProducts = async (connection, products) => {
  await executeMany(connection, `
    INSERT INTO products (
      id, name, image_url, size, sku, category_id, supplier, unit_of_measure,
      current_quantity, low_stock_threshold, cost_price, description, is_active,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      image_url = VALUES(image_url),
      size = VALUES(size),
      sku = VALUES(sku),
      category_id = VALUES(category_id),
      supplier = VALUES(supplier),
      unit_of_measure = VALUES(unit_of_measure),
      current_quantity = VALUES(current_quantity),
      low_stock_threshold = VALUES(low_stock_threshold),
      cost_price = VALUES(cost_price),
      description = VALUES(description),
      is_active = VALUES(is_active),
      updated_at = VALUES(updated_at)
  `, products.map((product) => [
    oid(product._id),
    product.name,
    product.imageUrl || '',
    product.size || '',
    product.sku,
    oid(product.category),
    oid(product.supplier) || product.supplier || '',
    product.unitOfMeasure,
    Number(product.currentQuantity || 0),
    Number(product.lowStockThreshold || 10),
    Number(product.costPrice || 0),
    product.description || '',
    bool(product.isActive, true),
    mysqlDateTime(product.createdAt),
    mysqlDateTime(product.updatedAt)
  ]));

  return products.length;
};

const importPurchaseOrders = async (connection, purchaseOrders) => {
  await executeMany(connection, `
    INSERT INTO purchase_orders (
      id, supplier_id, status, expected_delivery_date, total_amount, created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      supplier_id = VALUES(supplier_id),
      status = VALUES(status),
      expected_delivery_date = VALUES(expected_delivery_date),
      total_amount = VALUES(total_amount),
      created_by = VALUES(created_by),
      updated_at = VALUES(updated_at)
  `, purchaseOrders.map((order) => [
    oid(order._id),
    oid(order.supplier),
    order.status || 'Draft',
    mysqlDate(order.expectedDeliveryDate),
    Number(order.totalAmount || 0),
    oid(order.createdBy),
    mysqlDateTime(order.createdAt),
    mysqlDateTime(order.updatedAt)
  ]));

  const lines = purchaseOrders.flatMap((order) => (
    (order.lines || []).map((line) => [
      oid(line._id),
      oid(order._id),
      oid(line.product),
      Number(line.orderedQuantity || 0),
      Number(line.receivedQuantity || 0),
      Number(line.unitPrice || 0),
      mysqlDateTime(order.createdAt),
      mysqlDateTime(order.updatedAt)
    ])
  ));

  await executeMany(connection, `
    INSERT INTO purchase_order_lines (
      id, purchase_order_id, product_id, ordered_quantity, received_quantity, unit_price, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      purchase_order_id = VALUES(purchase_order_id),
      product_id = VALUES(product_id),
      ordered_quantity = VALUES(ordered_quantity),
      received_quantity = VALUES(received_quantity),
      unit_price = VALUES(unit_price),
      updated_at = VALUES(updated_at)
  `, lines);

  return { orders: purchaseOrders.length, lines: lines.length };
};

const importStockMovements = async (connection, stockMovements) => {
  await executeMany(connection, `
    INSERT INTO stock_movements (id, product_id, type, quantity, reason, performed_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      product_id = VALUES(product_id),
      type = VALUES(type),
      quantity = VALUES(quantity),
      reason = VALUES(reason),
      performed_by = VALUES(performed_by),
      updated_at = VALUES(updated_at)
  `, stockMovements.map((movement) => [
    oid(movement._id),
    oid(movement.product),
    movement.type,
    Number(movement.quantity || 0),
    movement.reason,
    oid(movement.performedBy),
    mysqlDateTime(movement.createdAt),
    mysqlDateTime(movement.updatedAt)
  ]));

  return stockMovements.length;
};

const importAuditLogs = async (connection, auditLogs) => {
  await executeMany(connection, `
    INSERT INTO audit_logs (
      id, user_id, module_name, action, target_id, before_state, after_state, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      module_name = VALUES(module_name),
      action = VALUES(action),
      target_id = VALUES(target_id),
      before_state = VALUES(before_state),
      after_state = VALUES(after_state),
      updated_at = VALUES(updated_at)
  `, auditLogs.map((log) => [
    oid(log._id),
    oid(log.user),
    log.module || log.moduleName,
    log.action,
    oid(log.targetId),
    json(normalizeJsonValue(log.beforeState), null),
    json(normalizeJsonValue(log.afterState), null),
    mysqlDateTime(log.createdAt),
    mysqlDateTime(log.updatedAt)
  ]));

  return auditLogs.length;
};

const main = async () => {
  const exportDirArg = process.argv.find((arg) => arg.startsWith('--dir='));
  const exportDir = exportDirArg ? exportDirArg.slice('--dir='.length) : DEFAULT_EXPORT_DIR;

  const data = {
    users: await readCollection(exportDir, 'users'),
    categories: await readCollection(exportDir, 'categories'),
    suppliers: await readCollection(exportDir, 'suppliers'),
    products: await readCollection(exportDir, 'products'),
    purchaseOrders: await readCollection(exportDir, 'purchaseOrders'),
    stockMovements: await readCollection(exportDir, 'stockMovements'),
    auditLogs: await readCollection(exportDir, 'auditLogs')
  };

  await connectDB();
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const summary = {};
    summary.users = await importUsers(connection, data.users);
    summary.categories = await importCategories(connection, data.categories);
    summary.suppliers = await importSuppliers(connection, data.suppliers);
    summary.products = await importProducts(connection, data.products);
    summary.purchaseOrders = await importPurchaseOrders(connection, data.purchaseOrders);
    summary.stockMovements = await importStockMovements(connection, data.stockMovements);
    summary.auditLogs = await importAuditLogs(connection, data.auditLogs);

    await connection.commit();
    console.log('Mongo export imported into MySQL:');
    console.table(summary);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
