const mongoose = require('mongoose')

const initMongo = () => {
  mongoose.connect(process.env.MLAB, {
    useNewUrlParser: true,
    autoIndex: true,
    autoReconnect: true,
  })
  mongoose.connection.once('open', () => {
    console.log('connected to mlab')
  })
  mongoose.set('useCreateIndex', true)

  mongoose.set('debug', true)
}

module.exports = initMongo
