const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const SocketIO = require('socket.io')

const ChatController = require('../common/ChatController')

let io = null

async function sendUsersToRoom(io) {
    const data = await ChatController.getAllUsers()
    io.emit('users', data)
}

async function sendMessagesToRoom(io) {
    const data = await ChatController.getAllMessages()
    io.emit('messages', data)
}

async function sendMessagesToSocket(socket, username) {
    const data = await ChatController.getAllMessages()
    socket.emit('messages', data)
}

function init(server) {
    io = SocketIO(server)

    io.on('connection', socket => {
        console.log('a user connected');
        socket.on('disconnect', reason => {
            console.log('disconnected');
        })

        socket.on('join', async args => {

            const { username } = args
            await ChatController.handleJoin(username)

            await sendUsersToRoom(io)
            await sendMessagesToSocket(socket, username)
        })
        socket.on('broadcast', async args => {

            const { username, msg } = args

            await ChatController.handleBroadcastMessage(username, msg)

            await sendMessagesToRoom(io)
        })

        socket.on('directmessage', async args => {

            const { username, to, msg } = args

            await ChatController.handleDirectMessage(username, to, msg)

            await sendMessagesToRoom(io)
        })

    });
}

module.exports = {
    init
}
