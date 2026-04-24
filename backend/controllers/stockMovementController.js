const StockMovement = require('../models/stockMovement');
const Product = require('../models/product');
const mongoose = require('mongoose');

// @desc    Record a new stock movement
// @route   POST /api/movements
// @access  Private (Admin or Staff with 'inventory' permission)
const recordMovement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { product, type, quantity, reason } = req.body;

    if (!product || !type || quantity === undefined || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Delta calculation
    let delta = Number(quantity);
    if (type === 'OUT') {
      delta = -Math.abs(delta);
    } else if (type === 'IN') {
      delta = Math.abs(delta);
    } else if (type === 'ADJUSTMENT') {
      // Keep delta as passed (+ or -)
    } else {
      return res.status(400).json({ message: 'Invalid movement type' });
    }

    // Check if product exists
    const existingProduct = await Product.findById(product).session(session);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Prevent stock going below 0 (unless we explicitly allow negative stock, but usually not)
    if (existingProduct.currentQuantity + delta < 0) {
      return res.status(400).json({ message: 'Movement would cause negative stock' });
    }

    // Create the movement
    const movement = await StockMovement.create([{
      product,
      type,
      quantity: delta, // We store the actual delta value used for easy aggregation later
      reason,
      performedBy: req.user.id
    }], { session });

    // Update the product quantity atomically
    existingProduct.currentQuantity += delta;
    await existingProduct.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate for response
    const populatedMovement = await StockMovement.findById(movement[0]._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    res.status(201).json(populatedMovement);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stock movements
// @route   GET /api/movements
// @access  Private
const getMovements = async (req, res) => {
  try {
    const { product, startDate, endDate } = req.query;
    let query = {};

    if (product) {
      query.product = product;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  recordMovement,
  getMovements
};
