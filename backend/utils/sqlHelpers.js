const crypto = require('crypto');

const createId = () => crypto.randomBytes(12).toString('hex');

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const bool = (value) => Boolean(Number(value));

const decimal = (value) => (value === null || value === undefined ? value : Number(value));

const dateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

const clean = (data) => Object.fromEntries(
  Object.entries(data).filter(([, value]) => value !== undefined)
);

const userRow = (row, includePassword = false) => {
  if (!row) return null;

  const user = {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: bool(row.is_active),
    permissions: parseJsonArray(row.permissions),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (includePassword) {
    user.password = row.password;
  }

  return user;
};

const categoryRow = (row) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  description: row.description || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const supplierRow = (row) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  contactPerson: row.contact_person || '',
  email: row.email || '',
  phone: row.phone || '',
  address: row.address || '',
  isActive: bool(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const warehouseRow = (row) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  location: row.location,
  contactPerson: row.contact_person,
  contactNumber: row.contact_number,
  isActive: bool(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const productRow = (row) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  imageUrl: row.image_url || '',
  size: row.size || '',
  sku: row.sku,
  category: row.category_id ? {
    _id: row.category_id,
    id: row.category_id,
    name: row.category_name,
    description: row.category_description || ''
  } : null,
  supplier: row.supplier,
  unitOfMeasure: row.unit_of_measure,
  currentQuantity: Number(row.current_quantity),
  lowStockThreshold: Number(row.low_stock_threshold),
  costPrice: decimal(row.cost_price),
  description: row.description || '',
  isActive: bool(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const movementRow = (row) => row && ({
  _id: row.id,
  id: row.id,
  product: row.product_id ? {
    _id: row.product_id,
    id: row.product_id,
    name: row.product_name,
    sku: row.product_sku
  } : null,
  type: row.type,
  quantity: Number(row.quantity),
  reason: row.reason,
  performedBy: row.performed_by ? {
    _id: row.performed_by,
    id: row.performed_by,
    name: row.user_name,
    email: row.user_email
  } : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

module.exports = {
  bool,
  categoryRow,
  clean,
  createId,
  dateOnly,
  decimal,
  movementRow,
  parseJsonArray,
  productRow,
  supplierRow,
  userRow,
  warehouseRow
};
