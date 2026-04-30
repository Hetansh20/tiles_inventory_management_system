const PurchaseOrder = require('../models/purchaseOrder');
const Product = require('../models/product');
const StockMovement = require('../models/stockMovement');
const mongoose = require('mongoose');
const { logAction } = require('../services/auditService');

const getOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({})
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('lines.product', 'name sku costPrice')
      .sort({ createdAt: -1 });
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

    const order = await PurchaseOrder.create({
      supplier,
      status: status || 'Draft',
      expectedDeliveryDate,
      lines: lines.map(line => ({
        product: line.product,
        orderedQuantity: line.orderedQuantity,
        receivedQuantity: 0,
        unitPrice: line.unitPrice
      })),
      totalAmount,
      createdBy: req.user.id
    });
    
    // Fetch with populated fields to return
    const populatedOrder = await PurchaseOrder.findById(order._id)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('lines.product', 'name sku costPrice');

    await logAction(req.user.id, 'orders', 'CREATE', order._id, null, populatedOrder);

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.status === 'Received') {
      return res.status(400).json({ message: 'Cannot update a fully received order' });
    }

    const oldState = JSON.parse(JSON.stringify(order));

    order.status = req.body.status;
    await order.save();
    
    const populatedOrder = await PurchaseOrder.findById(order._id)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('lines.product', 'name sku costPrice');

    await logAction(req.user.id, 'orders', 'UPDATE', order._id, oldState, populatedOrder);

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Expects body: { items: [{ lineId: "...", quantity: 10 }] }
const receiveItems = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await PurchaseOrder.findById(req.params.id).session(session);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (['Received', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot receive items for a ${order.status} order` });
    }

    const { items } = req.body; // Array of { lineId, quantity }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided to receive' });
    }

    const oldState = JSON.parse(JSON.stringify(order));
    let itemsReceivedThisTime = 0;

    for (const item of items) {
      if (item.quantity <= 0) continue;
      
      const line = order.lines.id(item.lineId);
      if (!line) {
        throw new Error(`Line item ${item.lineId} not found in this order`);
      }

      // Check if we are over-receiving (optional, but good practice)
      if (line.receivedQuantity + item.quantity > line.orderedQuantity) {
        throw new Error(`Cannot receive more than ordered for product ${line.product}`);
      }

      // 1. Update PO Line
      line.receivedQuantity += item.quantity;
      itemsReceivedThisTime += item.quantity;

      // 2. Update Product Inventory
      const product = await Product.findById(line.product).session(session);
      if (!product) throw new Error(`Product ${line.product} not found`);
      product.currentQuantity += item.quantity;
      await product.save({ session });

      // 3. Create StockMovement Ledger Entry
      await StockMovement.create([{
        product: line.product,
        type: 'IN',
        quantity: item.quantity,
        reason: `PO-${order._id} Received`,
        performedBy: req.user.id
      }], { session });
    }

    if (itemsReceivedThisTime === 0) {
      throw new Error('No valid quantities to receive');
    }

    // Determine new status
    let allReceived = true;
    let anyReceived = false;
    for (const line of order.lines) {
      if (line.receivedQuantity < line.orderedQuantity) allReceived = false;
      if (line.receivedQuantity > 0) anyReceived = true;
    }

    if (allReceived) {
      order.status = 'Received';
    } else if (anyReceived) {
      order.status = 'Partially Received';
    }

    await order.save({ session });
    
    await logAction(req.user.id, 'orders', 'UPDATE', order._id, oldState, order, session);
    
    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await PurchaseOrder.findById(order._id)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('lines.product', 'name sku costPrice');

    res.json(populatedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  receiveItems
};
