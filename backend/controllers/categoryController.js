const Category = require('../models/category');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching categories', error: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: new RegExp('^' + name + '$', 'i') });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = new Category({ name, description });
    await category.save();
    
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating category', error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    // Check if name is being changed to an existing name
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: new RegExp('^' + name + '$', 'i'),
        _id: { $ne: categoryId }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Another category with this name already exists' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Ideally, we would also check if any products are using this category before deleting.
    // For this implementation, we will just delete it.
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting category', error: error.message });
  }
};
