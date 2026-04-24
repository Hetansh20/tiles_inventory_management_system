const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// For simplicity, we are not applying authMiddleware to these routes yet,
// but in a production app they would be protected.
router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
