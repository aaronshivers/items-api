const mongoose = require('mongoose')

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
}

let server = '';

// if (process.env.NODE_ENV === 'development') {
//   server = 'mongodb://localhost:27017/notes'
// } else {
  server = 'mongodb://mongo:/mean-notes'
// }

const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(server, options)
    console.log(`MongoDB Connected: ${ conn.connection.host }`)
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = connectToDB
