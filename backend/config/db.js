const mysql = require('mysql2/promise');

let pool;

const escapeIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;

const getDatabaseName = () => process.env.MYSQL_DATABASE || process.env.DB_NAME || 'tiles_inventory_management';

const getConnectionConfig = (includeDatabase = true) => {
  const config = {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    namedPlaceholders: false,
    dateStrings: true
  };

  if (includeDatabase) {
    config.database = getDatabaseName();
  }

  return config;
};

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(24) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    permissions JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS categories (
    id CHAR(24) PRIMARY KEY,
    name VARCHAR(160) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS suppliers (
    id CHAR(24) PRIMARY KEY,
    name VARCHAR(180) NOT NULL UNIQUE,
    contact_person VARCHAR(160) NULL,
    email VARCHAR(190) NULL,
    phone VARCHAR(60) NULL,
    address TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS warehouses (
    id CHAR(24) PRIMARY KEY,
    name VARCHAR(180) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    contact_person VARCHAR(160) NOT NULL,
    contact_number VARCHAR(60) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS products (
    id CHAR(24) PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    image_url LONGTEXT NULL,
    size VARCHAR(80) NULL,
    sku VARCHAR(120) NOT NULL UNIQUE,
    category_id CHAR(24) NULL,
    supplier VARCHAR(190) NOT NULL,
    unit_of_measure VARCHAR(80) NOT NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 10,
    cost_price DECIMAL(12, 2) NOT NULL,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS stock_movements (
    id CHAR(24) PRIMARY KEY,
    product_id CHAR(24) NULL,
    type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    performed_by CHAR(24) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_movements_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id CHAR(24) PRIMARY KEY,
    supplier_id CHAR(24) NULL,
    status ENUM('Draft', 'Sent', 'Partially Received', 'Received', 'Cancelled') NOT NULL DEFAULT 'Draft',
    expected_delivery_date DATE NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_by CHAR(24) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_orders_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id CHAR(24) PRIMARY KEY,
    purchase_order_id CHAR(24) NOT NULL,
    product_id CHAR(24) NULL,
    ordered_quantity INT NOT NULL,
    received_quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_order_lines_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_lines_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(24) PRIMARY KEY,
    user_id CHAR(24) NULL,
    module_name VARCHAR(80) NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    target_id CHAR(24) NOT NULL,
    before_state JSON NULL,
    after_state JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_module (module_name),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

const migrationStatements = [
  'ALTER TABLE products MODIFY image_url LONGTEXT NULL'
];

const initializeTables = async () => {
  for (const statement of schemaStatements) {
    await pool.query(statement);
  }

  for (const statement of migrationStatements) {
    await pool.query(statement);
  }
};

const connectDB = async () => {
  try {
    const database = getDatabaseName();
    const bootstrap = await mysql.createConnection(getConnectionConfig(false));
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrap.end();

    pool = mysql.createPool(getConnectionConfig(true));
    await initializeTables();
    console.log('MySQL Connected');
  } catch (error) {
    console.log('MySQL Connection Error:', error);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('MySQL pool has not been initialized. Call connectDB() first.');
  }
  return pool;
};

const query = async (sql, params = []) => {
  const [rows] = await getPool().execute(sql, params);
  return rows;
};

const transaction = async (callback) => {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  connectDB,
  getPool,
  query,
  transaction
};
