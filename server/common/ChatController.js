const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))

const SAVED_CHAT_FILE = './chats.json'
const SYNC = false

let savedChatData = null

const users = [
    'jane', 'meryl', 'robin'
]

const messages = [
    { type : 'broadcast', from : 'jane', msg : 'Hi All!' },
    { type : 'broadcast', from : 'meryl', msg : 'Nice to have you here, Jane!' },
    { type : 'broadcast', from : 'robin', msg : 'Why are my messages getting delayed?' },
    { type : 'direct', from : 'jane', to : 'robin', msg : 'Are you in outer space?' },
    { type : 'direct', from : 'robin', to : 'jane', msg : 'What?!' },
    { type : 'direct', from : 'jane', to : 'robin', msg : "You're messages are very delayed" },
    { type : 'direct', from : 'robin', to : 'jane', msg : "I know, it's this dumass polling mechanism. Didn't we have server push like 10 years ago?" },
]

if (SYNC && fse.pathExistsSync(SAVED_CHAT_FILE)) {
    ;(async () => {
        savedChatData = await fse.readJsonAsync(SAVED_CHAT_FILE)
        users = savedChatData.users || []
        messages = savedChatData.messages || []
    })()
}

async function sync() {
    if (SYNC) {
        await fse.writeJsonAsync(SAVED_CHAT_FILE, { users, messages }, { spaces : 4 })
    }
}

function createDirectMessage(from, to, msg) {
    return { type : 'direct', from, to, msg }
}

function createBroadcastMessage(from, msg) {
    return { type : 'broadcast', from, msg }
}

async function handleJoin(username) {
    if (!users.find(u => u === username)) {
        users.push(username)
    }
    await sync()
}

async function getUsers(username) {
    return {
        users : users.filter(u => u !== username)
    }
}

async function getAllUsers() {
    return {
        users
    }
}

async function getMessages(username) {
    const broadcast = messages.filter(m => m.type === 'broadcast')

    const direct = {}
    messages.filter(m => m.type === 'direct' && (m.to === username || m.from === username))
        .forEach(m => {
            let otherUser = m.from === username ? m.to : m.from
            if (!direct[otherUser]) {
                direct[otherUser] = []
            }
            direct[otherUser].push(m)
        })

    return {
        broadcast,
        direct
    }
}

async function getAllMessages() {
    return {
        messages
    }
}

async function handleDirectMessage(username, to, msg) {

    messages.push(createDirectMessage(username, to, msg))

    await sync()
}

async function handleBroadcastMessage(username, msg) {

    messages.push(createBroadcastMessage(username, msg))

    await sync()
}

module.exports = {
    handleJoin,
    getUsers,
    getAllUsers,
    getMessages,
    getAllMessages,
    handleDirectMessage,
    handleBroadcastMessage,
}
