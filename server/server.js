const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuração CORS
app.use(cors());
app.use(express.json());

// Configuração Socket.io com CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Armazenamento de salas e participantes em memória
const rooms = new Map();

// Função auxiliar para obter informações da sala
function getRoomInfo(roomId) {
  return rooms.get(roomId) || { participants: [], maxParticipants: 5 };
}

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Criar ou entrar em uma sala
  socket.on('join-room', ({ roomId, userName, language }) => {
    const room = getRoomInfo(roomId);

    // Verificar se a sala está cheia
    if (room.participants.length >= room.maxParticipants) {
      socket.emit('room-full');
      return;
    }

    // Adicionar participante à sala
    const participant = {
      socketId: socket.id,
      userName: userName || `User ${socket.id.substring(0, 4)}`,
      language: language || 'pt'
    };

    room.participants.push(participant);
    rooms.set(roomId, room);

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = participant.userName;
    socket.language = language;

    console.log(`${participant.userName} entrou na sala ${roomId}`);

    // Notificar todos os participantes existentes sobre o novo usuário
    socket.to(roomId).emit('user-connected', participant);

    // Enviar lista de participantes existentes para o novo usuário
    const otherParticipants = room.participants.filter(p => p.socketId !== socket.id);
    socket.emit('existing-participants', otherParticipants);

    // Enviar lista atualizada de participantes para todos
    io.to(roomId).emit('participants-update', room.participants);
  });

  // WebRTC Signaling - Offer
  socket.on('offer', ({ offer, to }) => {
    console.log(`Enviando offer de ${socket.id} para ${to}`);
    io.to(to).emit('offer', {
      offer,
      from: socket.id,
      userName: socket.userName,
      language: socket.language
    });
  });

  // WebRTC Signaling - Answer
  socket.on('answer', ({ answer, to }) => {
    console.log(`Enviando answer de ${socket.id} para ${to}`);
    io.to(to).emit('answer', {
      answer,
      from: socket.id
    });
  });

  // WebRTC Signaling - ICE Candidate
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', {
      candidate,
      from: socket.id
    });
  });

  // Tradução de mensagem de texto
  socket.on('chat-message', ({ message, roomId, language }) => {
    const room = getRoomInfo(roomId);
    const sender = room.participants.find(p => p.socketId === socket.id);

    io.to(roomId).emit('chat-message', {
      message,
      from: sender?.userName || 'Anônimo',
      fromSocketId: socket.id,
      language,
      timestamp: Date.now()
    });
  });

  // Tradução de fala em tempo real
  socket.on('speech-transcript', ({ text, roomId, language }) => {
    console.log(`Transcrição de ${socket.userName}: ${text} (${language})`);

    socket.to(roomId).emit('speech-transcript', {
      text,
      from: socket.userName,
      fromSocketId: socket.id,
      sourceLanguage: language,
      timestamp: Date.now()
    });
  });

  // Controle de mídia (mute/unmute)
  socket.on('toggle-audio', ({ roomId, audioEnabled }) => {
    socket.to(roomId).emit('user-audio-toggle', {
      socketId: socket.id,
      audioEnabled
    });
  });

  socket.on('toggle-video', ({ roomId, videoEnabled }) => {
    socket.to(roomId).emit('user-video-toggle', {
      socketId: socket.id,
      videoEnabled
    });
  });

  // Compartilhamento de tela
  socket.on('start-screen-share', ({ roomId }) => {
    socket.to(roomId).emit('user-screen-share-started', {
      socketId: socket.id,
      userName: socket.userName
    });
  });

  socket.on('stop-screen-share', ({ roomId }) => {
    socket.to(roomId).emit('user-screen-share-stopped', {
      socketId: socket.id
    });
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);

    if (socket.roomId) {
      const room = getRoomInfo(socket.roomId);
      room.participants = room.participants.filter(p => p.socketId !== socket.id);

      if (room.participants.length === 0) {
        rooms.delete(socket.roomId);
        console.log(`Sala ${socket.roomId} removida (vazia)`);
      } else {
        rooms.set(socket.roomId, room);

        // Notificar outros participantes
        socket.to(socket.roomId).emit('user-disconnected', socket.id);
        io.to(socket.roomId).emit('participants-update', room.participants);
      }
    }
  });

  socket.on('leave-room', () => {
    if (socket.roomId) {
      const room = getRoomInfo(socket.roomId);
      room.participants = room.participants.filter(p => p.socketId !== socket.id);

      if (room.participants.length === 0) {
        rooms.delete(socket.roomId);
      } else {
        rooms.set(socket.roomId, room);
        socket.to(socket.roomId).emit('user-disconnected', socket.id);
        io.to(socket.roomId).emit('participants-update', room.participants);
      }

      socket.leave(socket.roomId);
      socket.roomId = null;
    }
  });
});

// Endpoint de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// Endpoint para listar salas ativas
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    participants: room.participants.length,
    maxParticipants: room.maxParticipants
  }));
  res.json(roomList);
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor Meetrans rodando na porta ${PORT}`);
  console.log(`📡 WebSocket pronto para conexões`);
});
