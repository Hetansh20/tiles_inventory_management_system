const User = require('../models/user')
const bcrypt = require('bcryptjs')

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (user) {
      user.isActive = !user.isActive
      const updatedUser = await user.save()
      res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        permissions: updatedUser.permissions
      })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive, permissions } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'staff',
      isActive: isActive !== undefined ? isActive : true,
      permissions: permissions || []
    })

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email
      user.role = req.body.role || user.role
      if (req.body.isActive !== undefined) {
        user.isActive = req.body.isActive
      }
      if (req.body.permissions !== undefined) {
        user.permissions = req.body.permissions
      }
      
      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10)
      }

      const updatedUser = await user.save()
      
      res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        permissions: updatedUser.permissions
      })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getAllUsers, toggleUserStatus, createUser, updateUser }
