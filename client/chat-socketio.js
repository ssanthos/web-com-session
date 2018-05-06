let otherUsers = []
let allMessages = {}

let selectedChat = 'broadcast'
let username = 'unnamed'


const socket = io()

function setupSocketListeners() {
    socket.on('users', args => {
        otherUsers = args.users.filter(u => u !== username)
        refreshSidebar()
    })
    socket.on('messages', args => {
        const { messages } = args

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

        allMessages = {
            broadcast,
            direct
        }

        refreshMessages()
    })
}

function join() {
    let u = username
    while (u === 'unnamed') {
        u = prompt("Please enter your username", "")
    }
    username = u
    socket.emit('join', { username : u })
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function refreshSidebar() {
    $('.sidebar .users').empty()
    otherUsers.forEach(u => {
        $('.sidebar .users').append('<li data-name="' + u + '" class="' + (u === selectedChat ? 'selected' : '') + '">' + capitalizeFirstLetter(u) + '</li>')
    })
    $('.sidebar .users li').click(function() {
        selectedChat = $(this).data('name')
        $('.sidebar .users li, .sidebar .channels li').removeClass('selected')
        $(this).addClass('selected')
        refreshMessages()
    })
}

function refreshMessages() {
    $('.messagepanel .messages').empty()
    if (selectedChat === 'broadcast') {
        $('.messagepanel .header').html('Broadcast messages')
        allMessages['broadcast'].forEach(m => {
            $('.messagepanel .messages').append('<div><b>' + capitalizeFirstLetter(m.from) + '</b> ' + m.msg + '</div>')
        })
    } else {
        $('.messagepanel .header').html('Messages with ' + capitalizeFirstLetter(selectedChat))
        const messages = allMessages['direct'][selectedChat]
        if (messages) {
            messages.forEach(m => {
                const from = m.from === username ? 'You' : capitalizeFirstLetter(m.from)
                $('.messagepanel .messages').append('<div><b>' + from + '</b> ' + m.msg + '</div>')
            })
        }
    }
}

async function postNewMessage(msg) {
    if (selectedChat === 'broadcast') {
        socket.emit('broadcast', { username, msg })
    } else {
        socket.emit('directmessage', { username, msg, to : selectedChat })
    }
}

function setupEventHandlers() {
    $('.sidebar .channels li').click(function() {
        selectedChat = $(this).data('name')
        $('.sidebar .users li, .sidebar .channels li').removeClass('selected')
        $(this).addClass('selected')
        refreshMessages()
    })

    $('.messagepanel input').on('keypress', e => {
        if (e.keyCode == 13) {
            const msg = $('.messagepanel input').val().trim()
            $('.messagepanel input').val('')
            if (msg) {
                postNewMessage(msg)
            }
        }
    })
}

async function init() {
    try {
        setupSocketListeners()

        join()

        setupEventHandlers()

    } catch (err) {
        console.log(err);
    }

}

$(document).ready(() => {
    init()
})
