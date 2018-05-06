const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const router = require('express').Router()

const ChatController = require('../common/ChatController')

router.use('*', (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
})

router.post('/join', async (req, res, next) => {
    const { username } = req.body

    await ChatController.handleJoin(username)

    res.cookie('username', username, {
        httpOnly : false
    })

    res.send()
})

router.get('/users', async (req, res, next) => {
    const { username } = req.cookies

    res.json(await ChatController.getUsers(username))
})

router.get('/messages', async (req, res, next) => {
    const { username } = req.cookies

    res.json(await ChatController.getMessages(username))
})

router.post('/directmessage', async (req, res, next) => {
    const { username } = req.cookies

    const { to, msg } = req.body

    await ChatController.handleDirectMessage(username, to, msg)

    res.send()
})

router.post('/broadcast', async (req, res, next) => {

    const { username } = req.cookies

    const { msg } = req.body

    await ChatController.handleBroadcastMessage(username, msg)

    res.send()
})

module.exports = router
