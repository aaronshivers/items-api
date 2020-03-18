if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const helmet = require('helmet')
const cors = require('cors')
const timeout = require('connect-timeout')

// connect to database
require('./db/mongoose')()

const indexRoutes = require('./routes/index/index')
const notesRoutes = require('./routes/notes/notes')
const usersRoutes = require('./routes/users/users')

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(timeout('5s'))

app.use(indexRoutes)
app.use(notesRoutes)
app.use(usersRoutes)

app.use((req, res, next) => {
  res.status(404).json({ 'error': 'Sorry, we cannot find that!' })
})

app.use((err, req, res, next) => {
  res.status(500).json({ 'error': err.message })
})

module.exports = app
