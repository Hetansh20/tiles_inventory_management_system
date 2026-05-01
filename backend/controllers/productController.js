const { query } = require('../config/db');
const { createId, productRow } = require('../utils/sqlHelpers');
const { logAction } = require('../services/auditService');

const productSelect = `
  SELECT
    p.*,
    c.id AS category_id,
    c.name AS category_name,
    c.description AS category_description
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

const findProduct = async (id) => {
  const rows = await query(`${productSelect} WHERE p.id = ? LIMIT 1`, [id]);
  return productRow(rows[0]);
};

exports.getProducts = async (req, res) => {
  try {
    const products = await query(`${productSelect} ORDER BY p.name ASC`);
    res.json(products.map(productRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      supplier,
      unitOfMeasure,
      currentQuantity,
      lowStockThreshold,
      costPrice,
      description,
      imageUrl,
      size
    } = req.body;

    const existingSkus = await query('SELECT id FROM products WHERE LOWER(sku) = LOWER(?) LIMIT 1', [sku]);
    if (existingSkus.length) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    const id = createId();
    await query(
      `INSERT INTO products
        (id, name, sku, category_id, supplier, unit_of_measure, current_quantity, low_stock_threshold, cost_price, description, image_url, size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        sku,
        category,
        supplier,
        unitOfMeasure,
        Number(currentQuantity || 0),
        Number(lowStockThreshold || 10),
        Number(costPrice),
        description || '',
        imageUrl || '',
        size || ''
      ]
    );

    const product = await findProduct(id);
    await logAction(req.user.id, 'products', 'CREATE', product._id, null, product);

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      supplier,
      unitOfMeasure,
      lowStockThreshold,
      costPrice,
      description,
      imageUrl,
      size
    } = req.body;
    const productId = req.params.id;

    if (sku) {
      const existingSkus = await query(
        'SELECT id FROM products WHERE LOWER(sku) = LOWER(?) AND id <> ? LIMIT 1',
        [sku, productId]
      );
      if (existingSkus.length) {
        return res.status(400).json({ message: 'Another product with this SKU already exists' });
      }
    }

    const oldProduct = await findProduct(productId);
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await query(
      `UPDATE products
       SET name = ?, sku = ?, category_id = ?, supplier = ?, unit_of_measure = ?,
           low_stock_threshold = ?, cost_price = ?, description = ?, image_url = ?, size = ?
       WHERE id = ?`,
      [
        name || oldProduct.name,
        sku || oldProduct.sku,
        category || oldProduct.category?._id || null,
        supplier || oldProduct.supplier,
        unitOfMeasure || oldProduct.unitOfMeasure,
        lowStockThreshold !== undefined ? Number(lowStockThreshold) : oldProduct.lowStockThreshold,
        costPrice !== undefined ? Number(costPrice) : oldProduct.costPrice,
        description !== undefined ? description : oldProduct.description,
        imageUrl !== undefined ? imageUrl : oldProduct.imageUrl,
        size !== undefined ? size : oldProduct.size,
        productId
      ]
    );

    const product = await findProduct(productId);
    await logAction(req.user.id, 'products', 'UPDATE', product._id, oldProduct, product);

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const oldProduct = await findProduct(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    const product = await findProduct(req.params.id);

    await logAction(req.user.id, 'products', 'DELETE', product._id, oldProduct, product);

    res.json({ message: 'Product soft-deleted successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
};

exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await query('UPDATE products SET is_active = ? WHERE id = ?', [product.isActive ? 0 : 1, req.params.id]);
    const updatedProduct = await findProduct(req.params.id);

    await logAction(req.user.id, 'products', 'UPDATE', updatedProduct._id, product, updatedProduct);

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling product status', error: error.message });
  }
};
