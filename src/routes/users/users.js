const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')

const User = require('../../models/users')
const validate = require('../../middleware/validate')
const userValidator = require('../../middleware/userValidator')

router.post('/users', validate(userValidator), async (req, res) => {

  try {

    // get email and password from body
    const { email, password } = req.body

    // check DB for existing user
    const existingUser = await User.findOne({ email })

    // if the user exists, login, otherwise create the user
    if (existingUser) {

      // verify user password
      const hash = await bcrypt.compare(password, existingUser.password)

      // reject if password is incorrect
      if (!hash) return res.status(401).json({ error: 'Invalid Login' })

      // create auth token
      const token = await existingUser.generateAuthToken()

      // reject if token wasn't created
      if (!token) return res.status(500).json({ error: 'Server Error: Token Not Created' })

      // respond 200 and send token
      res.status(200).json({ idToken: token, expiresIn: 86400000 })

    } else {

      // create user
      const user = await new User({ email, password })

      // save user
      await user.save()

      // create auth token
      const token = await user.generateAuthToken()

      // reject if token wasn't created
      if (!token) return res.status(500).json({ error: 'Server Error: Token Not Created' })

      // respond 200 and send token
      res.status(200).json({ idToken: token, expiresIn: 86400000 })

    }

  } catch (error) {

    // return an error message
    res.status(400).send(error.message)
  }
})

module.exports = router
