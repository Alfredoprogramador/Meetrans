# 🌐 Meetrans - Videoconferência com Tradução em Tempo Real

![Meetrans Banner](https://img.shields.io/badge/Status-Funcional-success)
![License](https://img.shields.io/badge/License-MIT-blue)

Meetrans é uma aplicação web de videoconferência moderna com **tradução em tempo real em voz**, suportando até 5 participantes simultâneos em 6 idiomas diferentes.

## ✨ Funcionalidades

### 🎥 Videoconferência Básica
- ✅ Vídeo em HD com suporte para até 5 participantes
- ✅ Áudio de alta qualidade com cancelamento de eco
- ✅ Conexão peer-to-peer usando WebRTC
- ✅ Interface responsiva e moderna

### 🌍 Tradução em Tempo Real (Funcionalidade Principal)
- ✅ **Reconhecimento de fala automático** (Speech-to-Text)
- ✅ **Tradução instantânea** entre 6 idiomas
- ✅ **Síntese de voz** (Text-to-Speech) da tradução
- ✅ Suporte para: Português 🇧🇷, Inglês 🇺🇸, Espanhol 🇪🇸, Alemão 🇩🇪, Francês 🇫🇷, Italiano 🇮🇹

### 💬 Chat em Texto
- ✅ Mensagens instantâneas
- ✅ Tradução automática de mensagens
- ✅ Histórico de conversas

### 🎛️ Controles de Mídia
- ✅ Ativar/desativar microfone
- ✅ Ativar/desativar câmera
- ✅ Compartilhamento de tela
- ✅ Controle de tradução em tempo real

## 🏗️ Arquitetura

```
Meetrans/
├── server/                 # Backend Node.js
│   └── server.js          # Signaling server com Socket.io
├── client/                # Frontend React
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── VideoConference.tsx
│       │   └── VideoConference.css
│       ├── services/
│       │   ├── WebRTCService.ts
│       │   ├── SpeechService.ts
│       │   └── TranslationService.ts
│       ├── types/
│       │   └── index.ts
│       ├── App.tsx
│       ├── App.css
│       ├── index.tsx
│       └── index.css
├── package.json           # Dependências do backend
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** 16+ instalado
- **npm** ou **yarn**
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Câmera e microfone conectados

### Instalação

#### 1. Clonar o repositório
```bash
git clone https://github.com/Alfredoprogramador/Meetrans.git
cd Meetrans
```

#### 2. Instalar dependências do backend
```bash
npm install
```

#### 3. Instalar dependências do frontend
```bash
cd client
npm install
cd ..
```

### Executar a Aplicação

#### Terminal 1: Iniciar Backend
```bash
npm start
```
O servidor estará rodando em `http://localhost:5000`

#### Terminal 2: Iniciar Frontend
```bash
cd client
npm start
```
O cliente estará rodando em `http://localhost:3000`

### 🎯 Como Usar

1. **Abra o navegador** em `http://localhost:3000`
2. **Preencha os dados:**
   - Nome
   - ID da Sala (use o mesmo ID para conectar com outras pessoas)
   - Selecione seu idioma
3. **Clique em "Entrar na Sala"**
4. **Permita acesso** à câmera e microfone quando solicitado
5. **Compartilhe o ID da sala** com outros participantes

### 🎤 Como Funciona a Tradução

1. **Você fala** no seu idioma (ex: Português)
2. **Web Speech API** converte sua fala em texto
3. **API de Tradução** traduz o texto para o idioma do destinatário
4. **Text-to-Speech** reproduz a tradução em áudio no idioma destino
5. **Destinatário escuta** a tradução no idioma dele

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Socket.io** - Comunicação em tempo real
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React** - Biblioteca UI
- **TypeScript** - Type safety
- **WebRTC** - Comunicação peer-to-peer
- **Socket.io Client** - Cliente WebSocket
- **Web Speech API** - Reconhecimento e síntese de fala
- **Axios** - Cliente HTTP

### APIs Externas
- **LibreTranslate** - API de tradução gratuita (https://libretranslate.com)
- **Google STUN Servers** - Para NAT traversal no WebRTC

## 🔧 Configuração Avançada

### Alterar Porta do Backend
Edite `server/server.js`:
```javascript
const PORT = process.env.PORT || 5000;
```

### Alterar URL da API de Tradução
Edite `client/src/services/TranslationService.ts`:
```typescript
private apiUrl: string = 'https://libretranslate.com/translate';
```

### Adicionar Mais Idiomas
Edite `client/src/types/index.ts`:
```typescript
export const LANGUAGES = {
  pt: { name: 'Português', flag: '🇧🇷', code: 'pt-BR' },
  // Adicione mais idiomas aqui
};
```

## 📱 Compatibilidade de Navegadores

| Navegador | Suporte | Observações |
|-----------|---------|-------------|
| Chrome    | ✅ Completo | Recomendado |
| Firefox   | ✅ Completo | Bom suporte |
| Edge      | ✅ Completo | Baseado em Chromium |
| Safari    | ⚠️ Parcial | Web Speech API limitada |
| Opera     | ✅ Completo | Baseado em Chromium |

## 🐛 Solução de Problemas

### Câmera/Microfone não funcionam
- Verifique se o navegador tem permissão para acessar mídia
- Use HTTPS ou localhost (requisito do WebRTC)
- Verifique se outro aplicativo não está usando a câmera

### Tradução não funciona
- Verifique conexão com internet
- LibreTranslate pode ter limite de requisições
- Fallback local está ativo para frases comuns

### Sem áudio/vídeo de outros participantes
- Verifique firewall e NAT
- STUN servers podem estar bloqueados
- Tente reiniciar a conexão

### Reconhecimento de fala não funciona
- Web Speech API requer Chrome ou Edge
- Microfone deve estar habilitado
- Idioma selecionado deve estar correto

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👨‍💻 Autor

**Alfredo Programador**
- GitHub: [@Alfredoprogramador](https://github.com/Alfredoprogramador)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 📞 Suporte

Se encontrar problemas ou tiver sugestões:
- Abra uma **Issue** no GitHub
- Entre em contato através do repositório

---

**Desenvolvido com ❤️ por Alfredo**
