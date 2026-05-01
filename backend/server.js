const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./config/db')

const app = express()

connectDB()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/', (req, res) => {
  res.send('Welcome Ceramic API Running')
})

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const productRoutes = require('./routes/productRoutes')
const stockMovementRoutes = require('./routes/stockMovementRoutes')

const supplierRoutes = require('./routes/supplierRoutes')
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes')
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/movements', stockMovementRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/orders', purchaseOrderRoutes)
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))