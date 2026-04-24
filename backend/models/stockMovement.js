const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Note: Mongoose models are append-only by design for ledgers if we don't expose update/delete endpoints.
// We'll enforce append-only strictly in the controller.

module.exports = mongoose.model('StockMovement', stockMovementSchema);
