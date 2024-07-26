const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('register', (username) => {
        users[socket.id] = username;
        socket.broadcast.emit('user connected', username);
        console.log(`${username} s'est connecté`);
    });

    socket.on('chat message', (data) => {
        const { recipient, message } = data;
        const sender = users[socket.id];
        // Envoyer le message à l'expéditeur
        socket.emit('chat message', { sender, message });
        // Envoyer le message au destinataire
        for (let [id, name] of Object.entries(users)) {
            if (name === recipient) {
                io.to(id).emit('chat message', { sender, message });
                break;
            }
        }
    });

    socket.on('disconnect', () => {
        const username = users[socket.id];
        delete users[socket.id];
        socket.broadcast.emit('user disconnected', username);
        console.log(`${username} s'est déconnecté`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
