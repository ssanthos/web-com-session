const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const router = require('express').Router()
const { EventEmitter } = require('events')

const ChatController = require('../common/ChatController')

const usersChangeBus = new EventEmitter()
const messagesChangeBus = new EventEmitter()

usersChangeBus.setMaxListeners(100)
messagesChangeBus.setMaxListeners(100)

// setInterval(() => {
//     usersChangeBus.emit('change')
//     messagesChangeBus.emit('change')
// }, 10 * 1000)

router.use('*', (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
})

const needUsersOnce = {}, needMessagesOnce = {}

router.post('/join', async (req, res, next) => {
    const { username } = req.body

    await ChatController.handleJoin(username)

    res.cookie('username', username, {
        httpOnly : false
    })

    res.send()

    needUsersOnce[username] = true
    needMessagesOnce[username] = true

    usersChangeBus.emit('change')
})

router.get('/users', async (req, res, next) => {
    const { username } = req.cookies

    if (needUsersOnce[username]) {
        delete needUsersOnce[username]
        return res.json(await ChatController.getUsers(username))
    }

    const addChangeListener = () => {
        usersChangeBus.once('change', async data => {
            res.json(await ChatController.getUsers(username))
        })
    }

   addChangeListener()
})

router.get('/messages', async (req, res, next) => {
    const { username } = req.cookies

    if (needMessagesOnce[username]) {
        delete needMessagesOnce[username]
        return res.json(await ChatController.getMessages(username))
    }

    const addChangeListener = () => {
        messagesChangeBus.once('change', async data => {
            res.json(await ChatController.getMessages(username))
        })
    }

   addChangeListener()
})

router.post('/directmessage', async (req, res, next) => {
    const { username } = req.cookies

    const { to, msg } = req.body

    await ChatController.handleDirectMessage(username, to, msg)

    res.send()

    messagesChangeBus.emit('change')
})

router.post('/broadcast', async (req, res, next) => {

    const { username } = req.cookies

    const { msg } = req.body

    await ChatController.handleBroadcastMessage(username, msg)

    res.send()

    messagesChangeBus.emit('change')
})

module.exports = router
