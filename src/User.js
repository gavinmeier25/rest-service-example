const mongoose = require('mongoose')
const { Schema, model } = mongoose

const UserSchema = new Schema({
  id: { type: String, unique: true, index: true },
  email: { type: String, unique: true },
  password: String,
  pbd: Boolean,
})

const User = model('user', UserSchema)

module.exports = User
