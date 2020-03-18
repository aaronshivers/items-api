const expect = require('expect')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongodb')
const User = require('../models/users')

describe('users model', () => {

  beforeEach(async () => {
    await User.deleteMany()
  })

  describe('user.generateAuthToken()', () => {

    it('should return a valid JWT', async () => {

      const payload = {
        _id: new ObjectId().toHexString(),
        email: 'user@email.com',
        password: 'asdfASDF1234!@#$',
      }

      const user = await new User(payload)
      const token = await user.generateAuthToken()
      const secret = process.env.JWT_SECRET
      const decoded = jwt.verify(token, secret)

      expect(decoded._id).toEqual(payload._id)
    })
  })
})
