const sourceLanguage = document.getElementById('sourceLanguage');
const targetLanguage = document.getElementById('targetLanguage');
const toggleButton = document.getElementById('toggleButton');
const originalCaption = document.getElementById('originalCaption');
const translatedCaption = document.getElementById('translatedCaption');
const statusMessage = document.getElementById('statusMessage');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRunning = false;

const setStatus = (message) => {
  statusMessage.textContent = message;
};

const setCaptions = (original, translated) => {
  originalCaption.textContent = original;
  translatedCaption.textContent = translated;
};

const translateText = async (text) => {
  if (!text.trim()) {
    return '';
  }

  if (sourceLanguage.value === targetLanguage.value) {
    return text;
  }

  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: sourceLanguage.value,
      target: targetLanguage.value,
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error('Falha ao traduzir.');
  }

  const result = await response.json();
  return result.translatedText || '';
};

const stopRecognition = () => {
  if (!recognition) {
    return;
  }

  isRunning = false;
  recognition.stop();
  toggleButton.textContent = 'Iniciar tradução ao vivo';
  setStatus('Tradução pausada.');
};

const startRecognition = () => {
  if (!SpeechRecognition) {
    setStatus('Seu navegador não suporta reconhecimento de voz em tempo real.');
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();

      if (!transcript) {
        return;
      }

      setCaptions(transcript, 'Traduzindo...');

      try {
        const translated = await translateText(transcript);
        setCaptions(transcript, translated || 'Sem tradução disponível.');
      } catch (error) {
        setCaptions(transcript, 'Erro ao traduzir no momento.');
      }
    };

    recognition.onerror = () => {
      setStatus('Não foi possível continuar a captação de áudio.');
      stopRecognition();
    };

    recognition.onend = () => {
      if (isRunning) {
        recognition.start();
      }
    };
  }

  recognition.lang = sourceLanguage.value;
  isRunning = true;
  recognition.start();
  toggleButton.textContent = 'Parar tradução ao vivo';
  setStatus('Captando áudio e traduzindo em tempo real...');
};

toggleButton.addEventListener('click', () => {
  if (isRunning) {
    stopRecognition();
    return;
  }

  startRecognition();
});
