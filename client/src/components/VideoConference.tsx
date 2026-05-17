import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './VideoConference.css';
import WebRTCService from '../services/WebRTCService';
import SpeechService from '../services/SpeechService';
import TranslationService from '../services/TranslationService';
import { Participant, Message, LANGUAGES } from '../types';

interface VideoConferenceProps {
  roomId: string;
  userName: string;
  userLanguage: string;
  onLeave: () => void;
}

interface RemoteStream {
  socketId: string;
  stream: MediaStream;
  userName: string;
  language: string;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  roomId,
  userName,
  userLanguage,
  onLeave
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Inicializar conexão Socket.io e WebRTC
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Conectado ao servidor');
      setSocket(newSocket);
      WebRTCService.setSocket(newSocket);

      // Entrar na sala
      newSocket.emit('join-room', {
        roomId,
        userName,
        language: userLanguage
      });
    });

    newSocket.on('room-full', () => {
      alert('Sala cheia! Máximo de 5 participantes.');
      onLeave();
    });

    // Inicializar stream local
    initLocalStream();

    return () => {
      if (newSocket) {
        newSocket.emit('leave-room');
        newSocket.close();
      }
      WebRTCService.cleanup();
      SpeechService.stop();
    };
  }, []);

  // Configurar listeners do Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('existing-participants', (existingParticipants: Participant[]) => {
      console.log('Participantes existentes:', existingParticipants);
      setIsConnecting(false);

      // Criar ofertas para todos os participantes existentes
      existingParticipants.forEach((participant) => {
        WebRTCService.createOffer(participant.socketId, (stream) => {
          addRemoteStream(participant.socketId, stream, participant.userName, participant.language);
        });
      });
    });

    socket.on('user-connected', (participant: Participant) => {
      console.log('Novo participante:', participant);
      addMessage({
        id: Date.now().toString(),
        text: `${participant.userName} entrou na sala`,
        from: 'Sistema',
        fromSocketId: 'system',
        timestamp: Date.now(),
        language: 'system'
      });
    });

    socket.on('offer', async ({ offer, from, userName: fromUserName, language }) => {
      console.log('Offer recebido de:', fromUserName);
      await WebRTCService.handleOffer(offer, from, (stream) => {
        addRemoteStream(from, stream, fromUserName, language);
      });
    });

    socket.on('answer', async ({ answer, from }) => {
      console.log('Answer recebido de:', from);
      await WebRTCService.handleAnswer(answer, from);
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      await WebRTCService.handleIceCandidate(candidate, from);
    });

    socket.on('user-disconnected', (socketId: string) => {
      console.log('Usuário desconectado:', socketId);
      removeRemoteStream(socketId);
      WebRTCService.removePeerConnection(socketId);
    });

    socket.on('participants-update', (updatedParticipants: Participant[]) => {
      setParticipants(updatedParticipants);
    });

    socket.on('chat-message', async (msg: Message) => {
      const translatedText = await TranslationService.translate(
        msg.text,
        msg.language,
        userLanguage
      );

      addMessage({
        id: Date.now().toString(),
        text: msg.text,
        from: msg.from,
        fromSocketId: msg.fromSocketId,
        timestamp: msg.timestamp,
        language: msg.language,
        translated: translatedText !== msg.text ? translatedText : undefined
      });
    });

    socket.on('speech-transcript', async ({ text, from, sourceLanguage }) => {
      if (isTranslating) {
        const translatedText = await TranslationService.translate(
          text,
          sourceLanguage,
          userLanguage
        );

        if (translatedText && translatedText !== text) {
          // Reproduzir tradução em áudio
          SpeechService.speak(translatedText, userLanguage);

          // Mostrar transcrição
          addMessage({
            id: Date.now().toString(),
            text: text,
            from: from,
            fromSocketId: 'speech',
            timestamp: Date.now(),
            language: sourceLanguage,
            translated: translatedText
          });
        }
      }
    });

    return () => {
      socket.off('existing-participants');
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
      socket.off('participants-update');
      socket.off('chat-message');
      socket.off('speech-transcript');
    };
  }, [socket, isTranslating, userLanguage]);

  const initLocalStream = async () => {
    try {
      const stream = await WebRTCService.getLocalStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Iniciar reconhecimento de fala
      if (socket) {
        SpeechService.start(userLanguage, (transcript) => {
          socket.emit('speech-transcript', {
            text: transcript,
            roomId,
            language: userLanguage
          });
        });
      }
    } catch (error) {
      console.error('Erro ao inicializar stream:', error);
      alert('Não foi possível acessar câmera/microfone');
    }
  };

  const addRemoteStream = (socketId: string, stream: MediaStream, name: string, language: string) => {
    setRemoteStreams(prev => {
      const exists = prev.find(s => s.socketId === socketId);
      if (exists) return prev;

      return [...prev, { socketId, stream, userName: name, language }];
    });
  };

  const removeRemoteStream = (socketId: string) => {
    setRemoteStreams(prev => prev.filter(s => s.socketId !== socketId));
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    WebRTCService.toggleAudio(newState);

    if (socket) {
      socket.emit('toggle-audio', { roomId, audioEnabled: newState });
    }

    if (newState) {
      SpeechService.start(userLanguage, (transcript) => {
        if (socket) {
          socket.emit('speech-transcript', {
            text: transcript,
            roomId,
            language: userLanguage
          });
        }
      });
    } else {
      SpeechService.stop();
    }
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    WebRTCService.toggleVideo(newState);

    if (socket) {
      socket.emit('toggle-video', { roomId, videoEnabled: newState });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        await WebRTCService.startScreenShare();
        setIsScreenSharing(true);
        if (socket) {
          socket.emit('start-screen-share', { roomId });
        }
      } else {
        await WebRTCService.stopScreenShare();
        setIsScreenSharing(false);
        if (socket) {
          socket.emit('stop-screen-share', { roomId });
        }
      }
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && socket) {
      socket.emit('chat-message', {
        message: messageInput,
        roomId,
        language: userLanguage
      });
      setMessageInput('');
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave-room');
      socket.close();
    }
    WebRTCService.cleanup();
    SpeechService.stop();
    onLeave();
  };

  useEffect(() => {
    // Atualizar referências de vídeos remotos
    remoteStreams.forEach(({ socketId, stream }) => {
      const videoElement = remoteVideosRef.current.get(socketId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  if (isConnecting) {
    return (
      <div className="connecting-screen">
        <div className="spinner"></div>
        <p>Conectando à sala...</p>
      </div>
    );
  }

  return (
    <div className="video-conference">
      <div className="conference-header">
        <div className="room-info">
          <h2>🌐 Sala: {roomId}</h2>
          <span>{LANGUAGES[userLanguage as keyof typeof LANGUAGES]?.flag} {userName}</span>
        </div>
        <div className="participants-count">
          👥 {participants.length} participante{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="videos-container">
        <div className="videos-grid">
          {/* Vídeo local */}
          <div className="video-wrapper local-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-element"
            />
            <div className="video-label">
              <span>{userName} (você)</span>
              {!videoEnabled && <span className="status-badge">📷 off</span>}
              {!audioEnabled && <span className="status-badge">🎤 off</span>}
            </div>
          </div>

          {/* Vídeos remotos */}
          {remoteStreams.map(({ socketId, userName: remoteName, language }) => (
            <div key={socketId} className="video-wrapper remote-video">
              <video
                ref={(el) => {
                  if (el) remoteVideosRef.current.set(socketId, el);
                }}
                autoPlay
                playsInline
                className="video-element"
              />
              <div className="video-label">
                <span>
                  {LANGUAGES[language as keyof typeof LANGUAGES]?.flag} {remoteName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>💬 Chat</h3>
            <button onClick={() => setShowChat(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.fromSocketId === 'system' ? 'system' : ''}`}>
                <strong>{msg.from}:</strong>
                <p>{msg.text}</p>
                {msg.translated && (
                  <p className="translated">🌍 {msg.translated}</p>
                )}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua mensagem..."
            />
            <button onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="controls-bar">
        <button
          className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
          onClick={toggleAudio}
          title={audioEnabled ? 'Desativar microfone' : 'Ativar microfone'}
        >
          {audioEnabled ? '🎤' : '🎤🚫'}
        </button>

        <button
          className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
          onClick={toggleVideo}
          title={videoEnabled ? 'Desativar câmera' : 'Ativar câmera'}
        >
          {videoEnabled ? '📹' : '📹🚫'}
        </button>

        <button
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
          title="Compartilhar tela"
        >
          🖥️
        </button>

        <button
          className={`control-btn ${!isTranslating ? 'disabled' : ''}`}
          onClick={() => setIsTranslating(!isTranslating)}
          title={isTranslating ? 'Desativar tradução' : 'Ativar tradução'}
        >
          {isTranslating ? '🌍' : '🌍🚫'}
        </button>

        <button
          className={`control-btn ${showChat ? 'active' : ''}`}
          onClick={() => setShowChat(!showChat)}
          title="Chat"
        >
          💬
        </button>

        <button
          className="control-btn leave-btn"
          onClick={handleLeave}
          title="Sair da sala"
        >
          📞 Sair
        </button>
      </div>
    </div>
  );
};

export default VideoConference;
