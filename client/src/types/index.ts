export interface Participant {
  socketId: string;
  userName: string;
  language: string;
}

export interface Message {
  id: string;
  text: string;
  from: string;
  fromSocketId: string;
  timestamp: number;
  language: string;
  translated?: string;
}

export interface SpeechTranscript {
  text: string;
  from: string;
  fromSocketId: string;
  sourceLanguage: string;
  timestamp: number;
}

export interface PeerConnection {
  socketId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const LANGUAGES = {
  pt: { name: 'Português', flag: '🇧🇷', code: 'pt-BR' },
  en: { name: 'English', flag: '🇺🇸', code: 'en-US' },
  es: { name: 'Español', flag: '🇪🇸', code: 'es-ES' },
  de: { name: 'Deutsch', flag: '🇩🇪', code: 'de-DE' },
  fr: { name: 'Français', flag: '🇫🇷', code: 'fr-FR' },
  it: { name: 'Italiano', flag: '🇮🇹', code: 'it-IT' }
};

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};
