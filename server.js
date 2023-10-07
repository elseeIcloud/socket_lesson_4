const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = http.createServer(app);
app.use(cors({ origin: 'http://localhost:8081' }));

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:8081",
        methods: ["GET", "POST"]
    }
});

const users = {}; // Объект для хранения пользователей и их соксетов

function updateUserCounts(io) {
    const rooms = io.sockets.adapter.rooms;

    for (const room in rooms) {
        if (room !== 'default-room') {
            io.to(room).emit('user count', rooms[room].length);
        }
    }
}

io.on('connection', (socket) => {
    console.log('Пользователь подключился');

    socket.join('default-room');

    socket.on('chat message', (data) => {
        io.to(data.room).emit('chat message', data);
    });

    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
        updateUserCounts(io);
    });

    socket.on('private message', ({ to, message }) => {
        if (users[to]) {
            users[to].emit('private message', { from: socket.id, message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился');
        delete users[socket.id];
        updateUserCounts(io);
    });

    users[socket.id] = socket;
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
