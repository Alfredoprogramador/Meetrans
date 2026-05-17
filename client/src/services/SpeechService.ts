import { LANGUAGES } from '../types';

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLanguage: string = 'pt';

  constructor() {
    // Verificar suporte do navegador
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.warn('Speech Recognition não suportado neste navegador');
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
  }

  start(language: string, onTranscript: (text: string) => void): void {
    if (!this.recognition) {
      console.warn('Speech Recognition não disponível');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.currentLanguage = language;
    const languageCode = LANGUAGES[language as keyof typeof LANGUAGES]?.code || 'pt-BR';
    this.recognition.lang = languageCode;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;

      if (transcript && transcript.trim().length > 0) {
        console.log('Transcrição:', transcript);
        onTranscript(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de fala:', event.error);

      // Tentar reiniciar em caso de erro
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this.isListening) {
            this.recognition.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      // Reiniciar automaticamente se ainda estiver em modo de escuta
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Erro ao reiniciar reconhecimento:', error);
        }
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('Reconhecimento de fala iniciado para:', languageCode);
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
        console.log('Reconhecimento de fala parado');
      } catch (error) {
        console.error('Erro ao parar reconhecimento:', error);
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Síntese de voz (Text-to-Speech)
  speak(text: string, language: string): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis não suportado');
      return;
    }

    // Cancelar qualquer fala em andamento
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const languageCode = LANGUAGES[language as keyof typeof LANGUAGES]?.code || 'pt-BR';
    utterance.lang = languageCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Tentar encontrar uma voz específica para o idioma
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language)) || 
                  voices.find(v => v.lang.startsWith(languageCode.split('-')[0]));

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onerror = (event) => {
      console.error('Erro na síntese de voz:', event);
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  isSpeaking(): boolean {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  // Obter vozes disponíveis
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }

  // Carregar vozes (necessário em alguns navegadores)
  loadVoices(callback: () => void): void {
    if ('speechSynthesis' in window) {
      // As vozes podem não estar disponíveis imediatamente
      let voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        callback();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            callback();
          }
        };
      }
    }
  }
}

export default new SpeechService();
