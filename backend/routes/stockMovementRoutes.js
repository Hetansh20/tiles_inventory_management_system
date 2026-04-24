const express = require('express');
const router = express.Router();
const { recordMovement, getMovements } = require('../controllers/stockMovementController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user has inventory permission
const checkInventoryPermission = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.permissions.includes('inventory'))) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized to perform inventory movements');
  }
};

router.route('/')
  .post(protect, checkInventoryPermission, recordMovement)
  .get(protect, getMovements);

module.exports = router;
