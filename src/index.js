const express = require('express')
const compression = require('compression')
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const initMongo = require('./initMongo')
const User = require('./User')
const Contact = require('./Contact')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

dotenv.config()

initMongo()

const app = express()

const whitelist = [
  `http://localhost:3000`,
  `${process.env.PBD_CLIENT}`,
  `${process.env.MESA_DASH}`,
  `${process.env.MESA_CLIENT}`,
]

app.use(
  cors({
    origin: whitelist,
    methods: 'GET,POST,PATCH,DELETE',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Access-Control-Allow-Origin',
      'Cookies',
    ],
    optionsSuccessStatus: 204,
  })
)

app.use(helmet())

app.use(compression())

app.use(morgan('combined'))

app.use(cookieParser())

app.use(bodyParser.json())

app.post('/login', async function(req, res) {
  const { user } = req.body

  if (!user) {
    res.status(400).send({ error: 'request body can not be undefined' })
  }

  if (!user.email) {
    res.status(400).send({ error: 'email can not be undefined' })
  }

  if (!user.password) {
    res.status(400).send({ error: 'password can not be undefined' })
  }

  const userDao = await User.find({ email: user.email })

  if (!userDao) {
    res.status(401).send({ error: 'no users found with that email' })
  }

  const passwordsMatch = await bcrypt.compare(
    user.password,
    userDao[0].password
  )

  if (!passwordsMatch) {
    res.status(401).send({ error: 'passwords do not match' })
  }

  const token = await jwt.sign(
    { userId: userDao[0].id },
    process.env.APP_SECRET
  )

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 3600000,
  })

  res.status(200).send({ token })
})

app.post('/create-account', async function(req, res) {
  const user = req.body

  if (!user)
    res.status(400).send({ error: 'request body can not be undefined' })
  if (!user.email) res.status(400).send({ error: 'email can not be undefined' })
  if (!user.password)
    res.status(400).send({ error: 'password can not be undefined' })

  const password = await bcrypt.hash(
    user.password,
    parseInt(process.env.SALT_ROUNDS)
  )
  const newUser = await new User({
    id: null,
    email: user.email,
    password: password,
    pbd: user.pbd,
  })
  newUser.id = newUser._id

  try {
    await newUser.save()
    res.status(200).send(newUser)
  } catch (err) {
    res.status(400).send({ error: 'could not save user' })
  }
})

app.post('/pbd/contact', async function(req, res) {
  console.log(req.body.form)
  console.log(req.body)
  const contact = req.body

  if (!contact) {
    res.status(400).send({ error: 'body cannot be undefined' })
  }

  const newContact = await new Contact({
    email: contact.email ? contact.email : '',
    subject: contact.subject ? contact.subject : '',
    message: contact.message ? contact.message : '',
    status: 'NEW',
    pbd: true,
  })
  newContact.id = newContact._id

  try {
    await newContact.save()
    res.status(201).send()
  } catch (err) {
    res.status(400).send({ error: 'could not save contact' })
  }
})

app
  .route('/pbd/contact')
  .all(async function(req, res, next) {
    const { token } = req.cookies

    if (token) {
      const { userId } = await jwt.verify(token, process.env.APP_SECRET)
      req.userId = userId
    } else {
      res.status(401).send()
    }

    next()
  })
  .get(async function(req, res) {
    const contacts = await Contact.find({ pbd: true })
    res.status(200).send(contacts)
  })
  .patch(async function(req, res) {
    const contact = req.body

    if (!contact) res.status(400).send({ error: 'body cannot be undefined' })
    if (!contact.id) res.status(400).send({ error: 'id cannot be undefined' })

    const contactToUpdate = await Contact.findById(contact.id)

    contactToUpdate.status = 'CONTACTED'

    await contactToUpdate.save()

    res.status(201).send()
  })
  .delete(async function(req, res) {
    const contact = req.body

    if (!contact) res.status(400).send({ error: 'body cannot be undefined' })
    if (!contact.id) res.status(400).send({ error: 'id cannot be undefined' })

    await Contact.findByIdAndDelete(contact.id)

    res.status(200).send({})
  })

app
  .route('/mesa/contact')
  .all(function(req, res, next) {
    const { token } = req.cookies

    if (token) {
      const { userId } = jwt.verify(token, process.env.APP_SECRET)
      req.userId = userId
    } else {
      res.status(401).send()
    }

    next()
  })
  .get(async function(req, res) {
    const contacts = await Contact.find({ pbd: false })
    res.status(200).send(contacts)
  })
  .post(async function(req, res) {
    const contact = req.body

    if (!contact) res.status(400).send({ error: 'body cannot be undefined' })

    const newContact = await new Contact({
      email: contact.email ? contact.email : '',
      subject: contact.subject ? contact.subject : '',
      message: contact.message ? contact.message : '',
      status: 'NEW',
      pbd: false,
    })
    newContact.id = newContact._id

    try {
      await newContact.save()
      res.status(201).send()
    } catch (err) {
      res.status(400).send({ error: 'could not save contact' })
    }
  })
  .patch(async function(req, res) {
    const contact = req.body

    if (!contact) res.status(400).send({ error: 'body cannot be undefined' })
    if (!contact.id) res.status(400).send({ error: 'id cannot be undefined' })

    const contactToUpdate = await Contact.findById(contact.id)

    contactToUpdate.status = 'CONTACTED'

    await contactToUpdate.save()

    res.status(201).send()
  })
  .delete(async function(req, res) {
    const contact = req.body

    if (!contact) res.status(400).send({ error: 'body cannot be undefined' })
    if (!contact.id) res.status(400).send({ error: 'id cannot be undefined' })

    await Contact.findByIdAndDelete(contact.id)

    res.status(200).send({})
  })

app.listen(process.env.APP_PORT, () => {
  console.log('server is listening on port 8000')
})
