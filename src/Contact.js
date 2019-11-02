const mongoose = require('mongoose')
const { Schema, model } = mongoose

const ContactSchema = new Schema({
  id: { type: String, unique: true, index: true },
  email: String,
  subject: String,
  message: String,
  status: String,
  pbd: Boolean,
})

const Contact = model('contact', ContactSchema)

module.exports = Contact
