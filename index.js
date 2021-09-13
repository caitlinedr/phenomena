require('dotenv').config();

const { PORT = 3000 } = process.env
const express = require('express');
const server = express();

const morgan = require('morgan');
server.use(morgan('dev'));

const cors = require('cors')
server.use(cors())

server.use(express.json());

const apiRouter = require('./api');
server.use('/api', apiRouter);

const { client } = require('./db')

server.use('*', (req, res, next) => {
    res.status(404);
    res.send('404 Error: path not found');
});

server.use((error, req, res, next) => {
    res.status(500);
    res.send(error);
});

server.listen(PORT, () => {
    client.connect()
})