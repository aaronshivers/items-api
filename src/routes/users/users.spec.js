const expect = require('expect')
const request = require('supertest')

const app = require('../../app')
const User = require('../../models/users')

describe('/users', () => {

  const user = {
    email: 'user1@example.net',
    password: 'asdfASDF1234!@#$',
  }

  // run before each test
  beforeEach(async () => {

    // delete all users
    await User.deleteMany()

    // save the user
    await new User(user).save()
  })

  // POST /users
  describe('POST /users', () => {

    describe('if `email` is invalid', () => {

      const userWithInvalidEmail = {
        email: 1234,
        password: '1234ASDF1!@#$asdf',
      }

      it('should respond 400', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidEmail)
          .expect(400)
      })

      it('should return an error message', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidEmail)
          .expect(res => {
            expect(res.body).toHaveProperty('error')
          })
      })

      it('should not add the user to the DB', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidEmail)

        const foundUser = await User.findOne({ email: userWithInvalidEmail.email })
        expect(foundUser).toBeFalsy()
      })

      it('should not provide an `auth token`', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidEmail)
          .expect(res => {
            expect(res.body).not.toHaveProperty('tokens')
          })
      })
    })

    describe('if `password` is invalid', () => {

      const userWithInvalidPassword = {
        email: 'bob@example.net',
        password: '1234',
      }

      it('should respond 400', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidPassword)
          .expect(400)
      })

      it('should return an error message', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidPassword)
          .expect(res => {
            expect(res.body).toHaveProperty('error')
          })
      })

      it('should not add the user to the DB', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidPassword)

        const foundUser = await User.findOne({ email: userWithInvalidPassword.email })
        expect(foundUser).toBeFalsy()
      })

      it('should not provide an `auth token`', async () => {
        await request(app)
          .post('/users')
          .send(userWithInvalidPassword)
          .expect(res => {
            expect(res.body).not.toHaveProperty('tokens')
          })
      })
    })

    describe('if `email` and `password` are valid', () => {

      describe('and `email` is already in the DB', () => {

        describe('and password is incorrect', async () => {

          const userWithIncorrectPassword = {
            email: user.email,
            password: 'hi12!Dude',
          }

          it('should respond 401', async () => {
            await request(app)
              .post('/users')
              .send(userWithIncorrectPassword)
              .expect(401)
          })

          it('should return an error message', async () => {
            await request(app)
              .post('/users')
              .send(userWithIncorrectPassword)
              .expect(res => {
                expect(res.body).toHaveProperty('error')
              })
          })

          it('should not provide an `auth token`', async () => {
            await request(app)
              .post('/users')
              .send(userWithIncorrectPassword)
              .expect(res => {
                expect(res.body).not.toHaveProperty('tokens')
              })
          })

          it('should not add a duplicate user to the DB', async () => {
            await request(app)
              .post('/users')
              .send(userWithIncorrectPassword)

            const foundUser = await User.find({ email: user.email })
            expect(foundUser.length).toBe(1)
          })
        })

        describe('and password is correct', () => {

          const existingUser = {
            email: user.email,
            password: user.password,
          }

          it('should respond 200`', async () => {
            await request(app)
              .post('/users')
              .send(user)
              .expect(200)
          })

          it('should create and return an `auth token`', async () => {
            await request(app)
              .post('/users')
              .send(user)
              .expect(res => {
                expect(res.body).toHaveProperty('idToken')
                // todo: test for the value of idToken
              })

            const foundUser = await User.findOne({ email: user.email })
            expect(foundUser.tokens.length).toBe(1)
          })

          it('should return the `expiresIn` unix time', async () => {
            await request(app)
              .post('/users')
              .send(user)
              .expect(res => {
                expect(res.body).toHaveProperty('expiresIn')
              })
          })

          it('should hash the user password', async () => {
            await request(app)
              .post('/users')
              .send(user)

            const foundUser = await User.findOne({ email: user.email })
            expect(foundUser.password).not.toEqual(user.password)
          })

          it('should not add a duplicate user to the DB', async () => {
            await request(app)
              .post('/users')
              .send(existingUser)

            const foundUser = await User.find({ email: user.email })
            expect(foundUser.length).toBe(1)
          })
        })
      })

      describe('and `email` is not already in the DB', () => {

        const newUser = {
          email: 'user2@example.net',
          password: 'asdfASDF1234!@#$',
        }

        it('should respond 200', async () => {
          await request(app)
            .post('/users')
            .send(newUser)
            .expect(200)
        })

        it('should hash the password', async () => {
          await request(app)
            .post('/users')
            .send(newUser)
            .expect(res => {
              expect(res.body.user.password).not.toEqual(user.password)
            })

          const foundUser = await User.findOne({ email: user.email })
          expect(foundUser.password).not.toEqual(user.password)
        })

        it('should create an auth token', async () => {
          await request(app)
            .post('/users')
            .send(newUser)
            .expect(res => {
              expect(res.body.user.tokens[0]).toHaveProperty('token')
            })

          const foundUser = await User.findOne({ email: newUser.email })
          expect(foundUser.tokens.length).toBe(1)
        })

        it('should return the `expiresIn` unix time', async () => {
          await request(app)
            .post('/users')
            .send(user)
            .expect(res => {
              expect(res.body).toHaveProperty('expiresIn')
            })
        })

        it('should return the user data', async () => {
          await request(app)
            .post('/users')
            .send(newUser)
            .expect(res => {
              expect(res.body.user.email).toBe(newUser.email)
              expect(res.body.user._id).toBeTruthy()
            })
        })

        it('should add the user to the DB', async () => {
          await request(app)
            .post('/users')
            .send(newUser)

          const foundUser = await User.findOne({ email: newUser.email })
          expect(foundUser.email).toEqual(newUser.email)
        })
      })
    })
  })
})
