const Product = require('../models/product');
const { logAction } = require('../services/auditService');

// Get all products (active and inactive, though frontend can filter)
exports.getProducts = async (req, res) => {
  try {
    // Populate the category field to return full category objects
    const products = await Product.find().populate('category', 'name description').sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, category, supplier, unitOfMeasure, currentQuantity, lowStockThreshold, costPrice, description } = req.body;
    
    const existingSku = await Product.findOne({ sku: new RegExp('^' + sku + '$', 'i') });
    if (existingSku) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    const product = new Product({
      name,
      sku,
      category,
      supplier,
      unitOfMeasure,
      currentQuantity: currentQuantity || 0, // default 0 if not provided
      lowStockThreshold: lowStockThreshold || 10,
      costPrice,
      description
    });

    await product.save();
    
    // Populate before returning
    const populatedProduct = await Product.findById(product._id).populate('category', 'name description');
    
    await logAction(req.user.id, 'products', 'CREATE', product._id, null, populatedProduct);
    
    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { name, sku, category, supplier, unitOfMeasure, lowStockThreshold, costPrice, description } = req.body;
    const productId = req.params.id;

    if (sku) {
      const existingSku = await Product.findOne({ 
        sku: new RegExp('^' + sku + '$', 'i'),
        _id: { $ne: productId }
      });
      if (existingSku) {
        return res.status(400).json({ message: 'Another product with this SKU already exists' });
      }
    }

    const oldProduct = await Product.findById(productId);
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { name, sku, category, supplier, unitOfMeasure, lowStockThreshold, costPrice, description },
      { new: true, runValidators: true }
    ).populate('category', 'name description');

    await logAction(req.user.id, 'products', 'UPDATE', product._id, oldProduct, product);

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
};

// Soft delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate('category', 'name description');
    
    await logAction(req.user.id, 'products', 'DELETE', product._id, oldProduct, product);

    res.json({ message: 'Product soft-deleted successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
};

// Toggle product status (active/inactive)
exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldState = JSON.parse(JSON.stringify(product));
    
    product.isActive = !product.isActive;
    await product.save();
    
    const populatedProduct = await Product.findById(product._id).populate('category', 'name description');

    await logAction(req.user.id, 'products', 'UPDATE', product._id, oldState, populatedProduct);

    res.json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling product status', error: error.message });
  }
};
