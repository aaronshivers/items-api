const expect = require('expect')
const request = require('supertest')
const { ObjectId } = require('mongodb')

const app = require('../../app')
const Note = require('../../models/notes')
const User = require('../../models/users')

const createUser = async () => {
  const userObj = {
    _id: new ObjectId(),
    email: 'user@test.com',
    password: 'asdfASDF1234!@#$',
  }

  const user = await new User(userObj).save()
  user.tokens.token = await user.generateAuthToken()

  return user
}

const createNote = async (userId) => {
  const noteObj = {
    _id: new ObjectId(),
    text: 'note1',
    completed: false,
    creator: userId,
  }

  return await new Note(noteObj).save()
}

describe('/notes', () => {
  let note
  let user
  let token

  beforeEach(async () => {
    await User.deleteMany()
    await Note.deleteMany()

    user = await createUser()
    note = await createNote(user._id)

    token = user.tokens[0].token
  })

  describe('POST /notes', () => {

    describe('if an `auth token` is not provided', () => {

      it('should respond 401', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .expect(401)
      })
    })

    describe('if an `auth token` is provided', () => {

      it('should respond 201', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .set('Authorization', `Bearer ${ token }`)
          .expect(201)
      })

      it('should post note to db', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .set('Authorization', `Bearer ${ token }`)
          .expect(res => expect(res.text).toContain(note.text))

        const foundNote = await Note.findOne({ text: note.text })
        expect(foundNote).toBeTruthy()
        expect(foundNote.text).toEqual(note.text)
      })

      it('should add the `creator ID` to the note', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .set('Authorization', `Bearer ${ token }`)

        const foundNote = await Note.findOne({ text: note.text })
        expect(foundNote.creator).toEqual(user._id)
      })

      it('should add a second note', async () => {

        await request(app)
          .post('/notes')
          .set('Authorization', `Bearer ${ token }`)
          .send(note)

        const foundNotes = await Note.find()
        expect(foundNotes.length).toBe(2)
      })
    })
  })

  describe('GET /notes', () => {

    describe('if an `auth token` is not provided', () => {

      it('should respond 401', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .expect(401)
      })
    })

    describe('if an `auth token` is provided', () => {

      describe('and the `user` is not the `creator`', () => {

       token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTc5YWJlZTdkZDQxODU5ZGZkNjc0NmUiLCJpYXQiOjE1ODUwMzIxNzR9.HzHTbr0kV3f0ZsTQ3OCar8bApgyiPYHbVGv0OUtWXX4'

        it('should respond 400', async () => {
          await request(app)
            .get(`/notes/1234`)
            .set('Authorization', `Bearer ${ token }`)
            .expect(400)
        })
      })

      describe('and the `user` is the `creator`', () => {

        describe('and there are no notes found for the `creator`', () => {

          beforeEach(async () => await Note.deleteMany())

          it('should respond 200', async () => {
            await request(app)
              .get('/notes')
              .set('Authorization', `Bearer ${ token }`)
              .expect(200)
          })

          it('should return an empty array', async () => {
            await request(app)
              .get('/notes')
              .set('Authorization', `Bearer ${ token }`)
              .expect(res => {
                expect(res.body).toEqual([])
              })
          })

          it('should have nothing in the database', async () => {
            await request(app)
              .get('/notes')
              .set('Authorization', `Bearer ${ token }`)

            const foundNotes = await Note.find()
            expect(foundNotes.length).toBe(0)
          })
        })

        describe('and there are notes found for the `creator`', () => {

          it('should respond 200', async () => {
            await request(app)
              .get('/notes')
              .set('Authorization', `Bearer ${ token }`)
              .expect(200)
          })

          it('should return all notes by the `creator`', async () => {
            await request(app)
              .get('/notes')
              .set('Authorization', `Bearer ${ token }`)
              .expect(res => {
                expect(res.text).toContain(note.text)
                expect(res.body.length).toBe(1)
              })
          })
        })
      })
    })
  })

  describe('GET /notes/:id', () => {

    describe('if an `auth token` is not provided', () => {

      it('should respond 401', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .expect(401)
      })
    })

    describe('if an `auth token` is provided', () => {

      describe('if `note id` is invalid', () => {

        it('should respond 400', async () => {
          await request(app)
            .get(`/notes/1234`)
            .set('Authorization', `Bearer ${ token }`)
            .expect(400)
        })
      })

      describe('if `note id` is valid', () => {

        describe('and the `note` is not found', () => {

          it('should respond 404', async () => {
            await request(app)
              .get(`/notes/5e4983e0186afc3c3b684bbb`)
              .expect(404)
              .set('Authorization', `Bearer ${ token }`)
              .expect(res => {
                expect(res.text)
                  .toEqual(JSON.stringify({ error: 'Note Not Found' }))
              })
          })
        })

        describe('and the `note` is found', () => {

          describe('and the `user` is not the `creator`', () => {

            beforeEach(() => {
              token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTc5YWJlZTdkZDQxODU5ZGZkNjc0NmUiLCJpYXQiOjE1ODUwMzIxNzR9.HzHTbr0kV3f0ZsTQ3OCar8bApgyiPYHbVGv0OUtWXX4'
            })

            it('should respond 400', async () => {
              await request(app)
                .get(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(400)
            })

            it('should not return the specified note', async () => {
              await request(app)
                .get(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(res => {
                  expect(res.text).not.toContain(note._id)
                  expect(res.text).not.toContain(note.text)
                })
            })
          })

          describe('and the `user` is the `creator`', () => {

            it('should respond 200', async () => {
              await request(app)
                .get(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(200)
            })

            it('should return the specified note', async () => {
              await request(app)
                .get(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(res => {
                  expect(res.text).toContain(note._id)
                  expect(res.text).toContain(note.text)
                })
            })
          })
        })
      })
    })
  })

  describe('DELETE /notes/:id', () => {

    describe('if an `auth token` is not provided', () => {

      it('should respond 401', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .expect(401)
      })
    })

    describe('if an `auth token` is provided', () => {

      describe('and the `user` is not the `creator`', () => {

        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTc5YWJlZTdkZDQxODU5ZGZkNjc0NmUiLCJpYXQiOjE1ODUwMzIxNzR9.HzHTbr0kV3f0ZsTQ3OCar8bApgyiPYHbVGv0OUtWXX4'

        it('should respond 400', async () => {
          await request(app)
            .patch(`/notes/1234`)
            .set('Authorization', `Bearer ${ token }`)
            .expect(400)
        })
      })

      describe('and the `user` is the `creator`', () => {

        describe('if `note id` is invalid', () => {

          it('should respond 400', async () => {
            await request(app)
              .delete(`/notes/1234`)
              .set('Authorization', `Bearer ${ token }`)
              .expect(400)
          })

          it('should not delete any notes', async () => {
            await request(app)
              .delete(`/notes/1234`)
              .set('Authorization', `Bearer ${ token }`)

            const foundNotes = await Note.find()
            expect(foundNotes).toBeTruthy()
            expect(foundNotes.length).toBe(1)
          })
        })

        describe('if `note id` is valid', () => {

          describe('and note does not exist', () => {

            it('should respond 404', async () => {
              await request(app)
                .delete(`/notes/5e547e0d22e5ea5888ca32d2`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(404)
            })

            it('should return an error message', async () => {
              await request(app)
                .delete(`/notes/5e547e0d22e5ea5888ca32d2`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(res => {
                  expect(res.text)
                    .toEqual(JSON.stringify({ error: 'Note Not Found' }))
                })
            })
          })

          describe('and note does exist', () => {

            it('should respond 200', async () => {
              await request(app)
                .delete(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .expect(200)
            })
          })
        })
      })
    })
  })

  describe('PATCH /notes/:id', () => {

    describe('if an `auth token` is not provided', () => {

      it('should respond 401', async () => {
        await request(app)
          .post('/notes')
          .send(note)
          .expect(401)
      })
    })

    describe('if an `auth token` is provided', () => {

      describe('and the `user` is not the `creator`', () => {

        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTc5YWJlZTdkZDQxODU5ZGZkNjc0NmUiLCJpYXQiOjE1ODUwMzIxNzR9.HzHTbr0kV3f0ZsTQ3OCar8bApgyiPYHbVGv0OUtWXX4'

        it('should respond 400', async () => {
          await request(app)
            .patch(`/notes/1234`)
            .set('Authorization', `Bearer ${ token }`)
            .expect(400)
        })
      })

      describe('and the `user` is the `creator`', () => {

        describe('and if `note id` is not in the DB', () => {

          it('should respond 404', async () => {
            await request(app)
              .patch(`/notes/` + new ObjectId())
              .set('Authorization', `Bearer ${ token }`)
              .expect(404)
          })

          it('should return an error message', async () => {
            await request(app)
              .patch(`/notes/` + new ObjectId())
              .set('Authorization', `Bearer ${ token }`)
              .expect(res => {
                expect(res.text)
                  .toEqual(JSON.stringify({ error: 'Note Not Found' }))
              })
          })
        })

        describe('and if `note id` is in the DB', () => {

          describe('and if updated data is invalid', () => {
            const update = { completed: 1234 }

            it('should respond 400', async () => {
              await request(app)
                .patch(`/notes/${ note._id }`)
                .expect(400)
                .set('Authorization', `Bearer ${ token }`)
                .send(update)
            })

            it('should return an error message', async () => {
              await request(app)
                .patch(`/notes/${ note._id }`)
                .send(update)
                .set('Authorization', `Bearer ${ token }`)
                .expect(res => {
                  expect(res.text)
                    .toEqual(JSON.stringify({ error: 'Completed Must be Boolean' }))
                })
            })

            it('should not update the specified note', async () => {
              await request(app)
                .patch(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .send(update)

              const foundNote = await Note.findById(note._id)
              expect(foundNote.completed).toBe(false)
            })
          })

          describe('and if updated data is valid', () => {
            const update = { completed: true }

            it('should respond 201', async () => {
              await request(app)
                .patch(`/notes/${ note._id }`)
                .expect(201)
                .set('Authorization', `Bearer ${ token }`)
                .send(update)
            })

            it('should update the specified note', async () => {
              await request(app)
                .patch(`/notes/${ note._id }`)
                .set('Authorization', `Bearer ${ token }`)
                .send(update)

              const foundNote = await Note.findById(note._id)
              expect(foundNote.completed).toBe(true)
            })
          })
        })
      })
    })
  })
})
