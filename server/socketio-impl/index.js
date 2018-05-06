const util = require('util')
const path = require('path')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const SocketIOAgent = require('./SocketIOAgent')

const port = parseInt(process.env.PORT || '3000', 10)

const app = express()

app.set('port', port)

app.use(express.static(path.join(__dirname, '../../client'), {
    setHeaders : (res, path, stat) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
    }
}));

app.use(cookieParser());

app.use(bodyParser.json({ limit: '50mb' }));

const server = http.createServer(app)
util.promisify(server.listen.bind(server))(port)

SocketIOAgent.init(server)
