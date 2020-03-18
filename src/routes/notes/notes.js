const express = require('express')
const router = express.Router()

const Note = require('../../models/notes')
const auth = require('../../middleware/auth')

router.post('/notes', auth, async (req, res) => {

  try {

    // get text from the body
    const { text } = req.body

    // create new note
    const note = new Note({ text })

    // save note
    await note.save()

    // return saved note
    res.status(201).json(note)

  } catch (error) {

    // return error message
    res.status(400).json(error.message)
  }
})

router.get('/notes', auth, async (req, res) => {

  try {

    // find all notes
    const notes = await Note.find()

    // throw error if there are no notes
    if (notes.length <= 0) return res.status(200).json({ 'error': 'No Notes Found' })

    // return notes
    res.status(200).json(notes)

  } catch (error) {

    // return error message
    res.status(400).json(error.message)
  }
})

router.get('/notes/:id', auth, async (req, res) => {

  try {

    // get note id
    const { id } = req.params

    // find note by note id
    const note = await Note.findById(id)

    // throw error if note is not found in the DB
    if (!note) return res.status(404).json({ error: 'Note Not Found' })

    // render note data
    res.status(200).json(note)

  } catch (error) {

    // send error message
    res.status(400).json({ error: error.message })

  }
})

router.delete('/notes/:id', auth, async (req, res) => {

  try {

    // get note id
    const { id } = req.params

    // find note by note id
    const note = await Note.findByIdAndDelete(id)

    // throw error if note is not found in the DB
    if (!note) return res.status(404).json({ error: 'Note Not Found' })

    // render note data
    res.status(200).json(note)

  } catch (error) {

    // send error message
    res.status(400).json({ error: error.message })

  }
})

router.patch('/notes/:id', auth, async (req, res) => {

  try {

    // get note id
    const { id } = req.params

    // get updated status from body
    const completed = req.body.completed

    // throw error if `typeof update.completed` is not boolean
    if (completed && typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed Must be Boolean' })
    }

    // find note by id and update
    const foundNote = await Note.findByIdAndUpdate(id, { completed })

    // throw error if note is not found in the DB
    if (!foundNote) return res.status(404).json({ error: 'Note Not Found' })

    // respond 201 and send note
    res.status(201).json(foundNote)

  } catch (error) {

    // send error message
    res.status(400).json({ error: error.message })

  }
})

module.exports = router
