require('dotenv').config()

const express = require('express')
const cors = require('cors')
const errorHandler = require('./middlewares/errorHandler')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const enterpriseRoutes = require('./routes/enterpriseRoutes')

const app = express()
const port = Number(process.env.PORT || 3000)

const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
const allowedOrigins = rawCorsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/enterprise', enterpriseRoutes)
app.use('/api/reports', require('./routes/wasteReportRoutes'))
app.use('/api/waste-types', require('./routes/wasteTypeRoutes'))
app.use('/enterprise', require('./routes/enterpriseRoutes'))

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`)
})

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
