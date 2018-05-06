function getCookieValue(key) {
    const str = document.cookie.split(';').find(i => i.indexOf(key + '=') >= 0)
    if (!str) {
        return null
    }
    return str.split('=')[1]
}

let otherUsers = []
let allMessages = {}

let selectedChat = 'broadcast'
let username = getCookieValue('username') || 'unnamed'

async function post(url, data) {
    return fetch(url, {
        method : 'POST',
        credentials: 'include',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(data)
    })
}

async function get(url) {
    return fetch(url, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    })
}

async function join() {
    let u = username
    while (u === 'unnamed') {
        u = prompt("Please enter your username", "")
    }
    const response = await post('/join', { username : u })
    if (response.ok) {
        //
        username = u
    } else {
        throw new Error('Network response was not ok.');
    }
}

async function getUsers() {
    try {
        const response = await get('/users')
        if (response.ok) {
            const data = await response.json()
            otherUsers = data.users
        } else {
            throw new Error('Network response was not ok.');
        }
    } catch (err) {
        console.log(err);
    }
}

async function getMessages() {
    try {
        const response = await get('/messages')
        if (response.ok) {
            const data = await response.json()
            allMessages = data
        } else {
            throw new Error('Network response was not ok.');
        }
    } catch (err) {
        console.log(err);
    }
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
        const response = await post('/broadcast', { msg })
        if (response.ok) {
            //
        } else {
            throw new Error('Network response was not ok.');
        }
    } else {
        const response = await post('/directmessage', { msg, to : selectedChat })
        if (response.ok) {
            //
        } else {
            throw new Error('Network response was not ok.');
        }
    }
    refreshMessages()
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

async function delay(ms) {
    return new Promise((resolve, _) => setTimeout(resolve, ms))
}

async function setupLongPollUsers() {
    while (true) {
        try {
            await getUsers()
            refreshSidebar()
            await delay(200)
        } catch (err) {
            console.error(err);
        }
    }
}

async function setupLongPollMessages() {
    while (true) {
        try {
            await getMessages()
            refreshMessages()
            await delay(200)
        } catch (err) {
            console.error(err);
        }
    }
}

async function init() {
    try {
        await join()

        setupEventHandlers()

        setupLongPollUsers()
        setupLongPollMessages()

    } catch (err) {
        console.log(err);
    }

}

$(document).ready(() => {
    init()
})
