const mongoose = require('mongoose')

const Schema = mongoose.Schema

const notesSchema = new Schema({
  text: {
    type: String,
    required: true,
    unique: false,
    lowercase: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  completed: {
    type: Boolean,
    required: false,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true
  }
})

const Note = mongoose.model('Note', notesSchema)

module.exports = Note
