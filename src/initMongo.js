const mongoose = require('mongoose')

const initMongo = () => {
  mongoose.connect(
    'mongodb://test:test9033@ds261077.mlab.com:61077/test-dashboard',
    { useNewUrlParser: true, autoIndex: true, autoReconnect: true }
  )
  mongoose.connection.once('open', () => {
    console.log('connected to mlab')
  })
  mongoose.set('useCreateIndex', true)

  mongoose.set('debug', true)
}

module.exports = initMongo
