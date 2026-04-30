const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus, receiveItems } = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.route('/:id')
  .put(protect, updateOrderStatus); // e.g. Cancel

router.route('/:id/receive')
  .post(protect, receiveItems);

module.exports = router;
