<template>
  <div>
    <h1>Чат</h1>
    <div>
      <select v-model="selectedRoom" @change="switchRoom">
        <option value="default-room">Общий чат</option>
        <option value="room1">Комната 1</option>
        <option value="room2">Комната 2</option>
        <!-- Добавьте дополнительные комнаты по мере необходимости -->
      </select>
    </div>
    <div>
      <input v-model="message" @keyup.enter="sendMessage" placeholder="Введите сообщение" />
      <button @click="sendMessage">Отправить</button>
    </div>
    <ul>
      <li v-for="msg in messages" :key="msg.id">{{ msg.text }}</li>
    </ul>
    <div>
      <input v-model="selectedUser" @change="selectUser" placeholder="Личное сообщение" />
      <button @click="sendPrivateMessage">Отправить</button>
    </div>
    <div v-if="selectedUser">
      Вы выбрали пользователя: {{ selectedUser }}
    </div>
    <p>Пользователей в текущей комнате: {{ userCount }}</p>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  name: 'chat-message',
  data() {
    return {
      selectedRoom: 'default-room',
      message: '',
      messages: [],
      privateMessage: '',
      selectedUser: null,
      onlineUsers: [],
      userCount: 0,
    };
  },
  computed: {
    roomSocket() {
      return this.socketRooms[this.selectedRoom];
    },
  },
  created() {
    this.initializeSocket();
  },
  methods: {
    initializeSocket() {
      this.socketRooms = {};
      const rooms = ['default-room', 'room1', 'room2'];

      rooms.forEach((room) => {
        this.socketRooms[room] = io.connect('http://localhost:3000');
        this.socketRooms[room].emit('join room', room);

        this.socketRooms[room].on('chat message', (message) => {
          if (message.room === this.selectedRoom) {
            this.messages.push(message);
          }
        });
      });

      this.selectedRoom = 'default-room';
    },
    sendMessage() {
      if (this.message.trim() !== '') {
        const messageObject = {
          id: new Date().toISOString(),
          text: this.message,
          room: this.selectedRoom,
        };
        this.messages.push(messageObject);

        this.roomSocket.emit('chat message', messageObject);

        this.message = '';
      }
    },
    switchRoom() {
      this.roomSocket.emit('join room', this.selectedRoom);
      this.messages = [];
    },
    selectUser() {
      if (this.socketRooms && this.socketRooms[this.selectedRoom] && this.socketRooms[this.selectedRoom].sockets) {
        this.onlineUsers = Object.keys(this.socketRooms[this.selectedRoom].sockets);
      }
    },

    sendPrivateMessage() {
      if (this.privateMessage.trim() !== '' && this.selectedUser) {
        const messageObject = {
          id: new Date().toISOString(),
          text: this.privateMessage,
        };

        this.socketRooms[this.selectedRoom].emit('private message', {
          to: this.selectedUser,
          message: messageObject,
        });

        this.privateMessage = '';
      }
    },
  },
};
</script>
