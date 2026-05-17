# 📚 Documentação Técnica - Meetrans

## Visão Geral da Arquitetura

Meetrans utiliza uma arquitetura cliente-servidor com comunicação em tempo real via WebSocket (Socket.io) e streaming peer-to-peer usando WebRTC.

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Cliente   │ ◄──────────────────────► │   Servidor  │
│   (React)   │       Sinalização        │   (Node.js) │
└─────────────┘                           └─────────────┘
	   │                                         │
	   │         WebRTC (Peer-to-Peer)          │
	   ▼                                         ▼
┌─────────────┐                           ┌─────────────┐
│  Cliente 2  │ ◄────────────────────────►│  Cliente 3  │
│   (React)   │    Áudio/Vídeo Direto    │   (React)   │
└─────────────┘                           └─────────────┘
```

## Backend (Node.js + Socket.io)

### Eventos Socket.io

#### Cliente → Servidor

**join-room**
```javascript
socket.emit('join-room', {
  roomId: string,
  userName: string,
  language: string
});
```
Entra em uma sala de conferência.

**offer**
```javascript
socket.emit('offer', {
  offer: RTCSessionDescription,
  to: string  // socketId do destinatário
});
```
Envia offer WebRTC para estabelecer conexão.

**answer**
```javascript
socket.emit('answer', {
  answer: RTCSessionDescription,
  to: string
});
```
Envia answer WebRTC em resposta ao offer.

**ice-candidate**
```javascript
socket.emit('ice-candidate', {
  candidate: RTCIceCandidate,
  to: string
});
```
Envia ICE candidate para estabelecer conexão.

**chat-message**
```javascript
socket.emit('chat-message', {
  message: string,
  roomId: string,
  language: string
});
```
Envia mensagem de texto no chat.

**speech-transcript**
```javascript
socket.emit('speech-transcript', {
  text: string,
  roomId: string,
  language: string
});
```
Envia transcrição de fala para tradução.

**toggle-audio / toggle-video**
```javascript
socket.emit('toggle-audio', {
  roomId: string,
  audioEnabled: boolean
});
```

#### Servidor → Cliente

**existing-participants**
```javascript
socket.on('existing-participants', (participants: Participant[]) => {});
```
Lista de participantes já na sala.

**user-connected**
```javascript
socket.on('user-connected', (participant: Participant) => {});
```
Novo usuário entrou na sala.

**user-disconnected**
```javascript
socket.on('user-disconnected', (socketId: string) => {});
```
Usuário saiu da sala.

**offer / answer / ice-candidate**
Sinalização WebRTC recebida de outro peer.

**chat-message**
Mensagem de chat recebida.

**speech-transcript**
Transcrição de fala recebida para tradução.

## Frontend (React + TypeScript)

### Estrutura de Componentes

```
App
├── VideoConference
│   ├── LocalVideo (ref: localVideoRef)
│   ├── RemoteVideo[] (refs: remoteVideosRef)
│   ├── ChatPanel
│   └── ControlsBar
```

### Serviços

#### WebRTCService

**Responsabilidades:**
- Gerenciar stream de mídia local
- Criar e gerenciar peer connections
- Lidar com sinalização WebRTC
- Controlar áudio/vídeo/compartilhamento de tela

**Métodos principais:**
```typescript
getLocalStream(): Promise<MediaStream>
createPeerConnection(socketId, onTrack): Promise<RTCPeerConnection>
createOffer(socketId, onTrack): Promise<void>
handleOffer(offer, fromSocketId, onTrack): Promise<void>
handleAnswer(answer, fromSocketId): Promise<void>
handleIceCandidate(candidate, fromSocketId): Promise<void>
toggleAudio(enabled: boolean): void
toggleVideo(enabled: boolean): void
startScreenShare(): Promise<MediaStream>
stopScreenShare(): Promise<void>
```

#### SpeechService

**Responsabilidades:**
- Reconhecimento de fala (Speech-to-Text)
- Síntese de voz (Text-to-Speech)
- Gerenciar vozes disponíveis

**Métodos principais:**
```typescript
start(language: string, onTranscript: (text) => void): void
stop(): void
speak(text: string, language: string): void
stopSpeaking(): void
getAvailableVoices(): SpeechSynthesisVoice[]
```

#### TranslationService

**Responsabilidades:**
- Traduzir texto entre idiomas
- Cache de traduções
- Fallback para tradução offline

**Métodos principais:**
```typescript
translate(text: string, fromLang: string, toLang: string): Promise<string>
translateBatch(texts: string[], fromLang, toLang): Promise<string[]>
clearCache(): void
detectLanguage(text: string): string
checkApiHealth(): Promise<boolean>
```

## Fluxo de Tradução em Tempo Real

### 1. Captura de Áudio
```
Microfone → getUserMedia() → MediaStream
```

### 2. Reconhecimento de Fala
```typescript
SpeechRecognition.start()
  ↓
onresult → transcript: string
  ↓
socket.emit('speech-transcript', { text, language })
```

### 3. Distribuição
```
Socket.io Server → Broadcast para todos os participantes
```

### 4. Tradução
```typescript
socket.on('speech-transcript', async ({ text, sourceLanguage }) => {
  const translated = await TranslationService.translate(
	text,
	sourceLanguage,
	userLanguage
  );
  // ...
});
```

### 5. Síntese de Voz
```typescript
SpeechService.speak(translatedText, userLanguage);
  ↓
SpeechSynthesis.speak(utterance)
  ↓
Alto-falantes
```

## WebRTC Connection Flow

### 1. Usuário A entra na sala
```
A → Server: join-room
Server → A: existing-participants [B, C]
A cria PeerConnection para B
A cria PeerConnection para C
A → B: offer
A → C: offer
```

### 2. Negociação com B
```
B recebe offer de A
B cria PeerConnection para A
B → A: answer
Troca de ICE candidates
Conexão estabelecida
Streaming de mídia peer-to-peer
```

## APIs Utilizadas

### Web Speech API
- **SpeechRecognition**: Converte fala em texto
- **SpeechSynthesis**: Converte texto em fala
- Suporte: Chrome, Edge, Safari (parcial)

### WebRTC API
- **getUserMedia**: Captura áudio/vídeo
- **RTCPeerConnection**: Conexão peer-to-peer
- **RTCDataChannel**: Canal de dados (não usado atualmente)

### LibreTranslate API
- **Endpoint**: https://libretranslate.com/translate
- **Método**: POST
- **Payload**:
```json
{
  "q": "texto para traduzir",
  "source": "pt",
  "target": "en",
  "format": "text"
}
```

## Configuração de ICE Servers

```typescript
const ICE_SERVERS = {
  iceServers: [
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:stun1.l.google.com:19302' },
	{ urls: 'stun:stun2.l.google.com:19302' }
  ]
};
```

STUN servers ajudam a descobrir o endereço IP público para NAT traversal.

## Estrutura de Dados

### Participant
```typescript
interface Participant {
  socketId: string;
  userName: string;
  language: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  text: string;
  from: string;
  fromSocketId: string;
  timestamp: number;
  language: string;
  translated?: string;
}
```

### RemoteStream
```typescript
interface RemoteStream {
  socketId: string;
  stream: MediaStream;
  userName: string;
  language: string;
}
```

## Otimizações

### 1. Cache de Traduções
```typescript
private cache: { [key: string]: string } = {};
```
Evita requisições duplicadas à API.

### 2. Reconnection Automático
```typescript
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### 3. Cleanup de Recursos
```typescript
useEffect(() => {
  return () => {
	WebRTCService.cleanup();
	SpeechService.stop();
	socket.close();
  };
}, []);
```

## Segurança

### Recomendações
1. Use HTTPS em produção (requisito WebRTC)
2. Implemente autenticação de usuários
3. Adicione rate limiting na API
4. Valide entrada de dados
5. Use TURN server para conexões mais robustas

### CORS
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## Performance

### Métricas Típicas
- **Latência de tradução**: 1-3 segundos
- **Latência WebRTC**: < 100ms (peer-to-peer)
- **Banda necessária**: ~2 Mbps por participante

### Dicas de Otimização
1. Limitar resolução de vídeo em conexões lentas
2. Usar codec VP8/VP9 para melhor compressão
3. Implementar qualidade adaptativa
4. Cache agressivo de traduções comuns

---

**Documentação mantida por:** Alfredo Programador  
**Última atualização:** 2024
