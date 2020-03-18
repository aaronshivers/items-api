const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 5,
    maxlength: 100,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 8,
    maxlength: 100
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
})

// hash plain text passwords
userSchema.pre('save', async function(next) {
  const user = this
  const saltingRounds = 10

  if (user.isNew) {
    try {
      user.password = await bcrypt.hash(user.password, saltingRounds)
    } catch (error) {
      next(error)
    }
  }
  next()
})

// create authentication token
userSchema.methods.generateAuthToken = async function () {
  const user = this

  const payload = { _id: user._id }
  const secret = process.env.JWT_SECRET
  const token = jwt.sign(payload, secret)

  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token
}

const User = mongoose.model('User', userSchema)

module.exports = User
