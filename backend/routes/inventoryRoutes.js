const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

// Protected routes - all require authentication
router.use(protect);

// GET operations
router.get('/', inventoryController.getAllInventory);
router.get('/summary', inventoryController.getInventorySummary);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/warehouse/:warehouseId', inventoryController.getInventoryByWarehouse);
router.get('/product/:productId', inventoryController.getInventoryByProduct);
router.get('/report', inventoryController.getInventoryReport);
router.get('/export', inventoryController.exportInventory);

// POST operations
router.post('/', inventoryController.createInventory);
router.post('/adjust', inventoryController.adjustInventory);
router.post('/transfer', inventoryController.transferStock);
router.post('/batch-update', inventoryController.batchUpdateInventory);

// PUT operations
router.put('/:inventoryId', inventoryController.updateInventoryQuantity);

module.exports = router;
