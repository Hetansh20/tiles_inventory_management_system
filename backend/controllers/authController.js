const User = require('../models/user')
const bcrypt = require('bcryptjs')
const { json } = require('express')
const jwt  = require('jsonwebtoken')

//Register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      name, email, password: hashedPassword, role
    })

    res.status(201).json({ message: 'User created successfully', user: newUser })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated by an administrator' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {register, login}