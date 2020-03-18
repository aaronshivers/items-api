const mongoose = require('mongoose')

const {
  MONGO_USER,
  MONGO_PASS,
  MONGO_CLUSTER,
  NODE_ENV,
} = process.env

const uri = `mongodb+srv://${ MONGO_CLUSTER }.mongodb.net`
const encodedUri = encodeURI(uri)

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  retryWrites: true,
  useUnifiedTopology: true,
  user: MONGO_USER,
  pass: MONGO_PASS,
  dbName: NODE_ENV,
}

const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(encodedUri, options)
    console.log(`MongoDB Connected: ${ conn.connection.host }`)
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = connectToDB
