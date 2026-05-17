import axios from 'axios';

interface TranslationCache {
  [key: string]: string;
}

class TranslationService {
  private cache: TranslationCache = {};
  private apiUrl: string = 'https://libretranslate.com/translate';
  private fallbackEnabled: boolean = true;

  // Gerar chave de cache
  private getCacheKey(text: string, from: string, to: string): string {
    return `${from}-${to}-${text.toLowerCase()}`;
  }

  // Traduzir texto usando LibreTranslate (API gratuita)
  async translate(text: string, fromLang: string, toLang: string): Promise<string> {
    // Se os idiomas são iguais, retornar o texto original
    if (fromLang === toLang) {
      return text;
    }

    // Verificar cache
    const cacheKey = this.getCacheKey(text, fromLang, toLang);
    if (this.cache[cacheKey]) {
      console.log('Tradução do cache:', this.cache[cacheKey]);
      return this.cache[cacheKey];
    }

    try {
      // Tentar traduzir com LibreTranslate
      const response = await axios.post(
        this.apiUrl,
        {
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      if (response.data && response.data.translatedText) {
        const translatedText = response.data.translatedText;

        // Armazenar no cache
        this.cache[cacheKey] = translatedText;

        console.log(`Traduzido (${fromLang} → ${toLang}):`, text, '→', translatedText);
        return translatedText;
      }

      throw new Error('Resposta inválida da API de tradução');
    } catch (error) {
      console.error('Erro na tradução:', error);

      // Fallback: tentar tradução local simplificada
      if (this.fallbackEnabled) {
        return this.fallbackTranslation(text, fromLang, toLang);
      }

      return text;
    }
  }

  // Tradução fallback com dicionário básico
  private fallbackTranslation(text: string, fromLang: string, toLang: string): string {
    console.log('Usando tradução fallback');

    // Dicionário básico de frases comuns
    const commonPhrases: { [key: string]: { [key: string]: string } } = {
      'hello': {
        'pt': 'olá',
        'en': 'hello',
        'es': 'hola',
        'de': 'hallo',
        'fr': 'bonjour',
        'it': 'ciao'
      },
      'goodbye': {
        'pt': 'tchau',
        'en': 'goodbye',
        'es': 'adiós',
        'de': 'auf wiedersehen',
        'fr': 'au revoir',
        'it': 'arrivederci'
      },
      'thank you': {
        'pt': 'obrigado',
        'en': 'thank you',
        'es': 'gracias',
        'de': 'danke',
        'fr': 'merci',
        'it': 'grazie'
      },
      'yes': {
        'pt': 'sim',
        'en': 'yes',
        'es': 'sí',
        'de': 'ja',
        'fr': 'oui',
        'it': 'sì'
      },
      'no': {
        'pt': 'não',
        'en': 'no',
        'es': 'no',
        'de': 'nein',
        'fr': 'non',
        'it': 'no'
      },
      'please': {
        'pt': 'por favor',
        'en': 'please',
        'es': 'por favor',
        'de': 'bitte',
        'fr': 's\'il vous plaît',
        'it': 'per favore'
      },
      'sorry': {
        'pt': 'desculpe',
        'en': 'sorry',
        'es': 'lo siento',
        'de': 'entschuldigung',
        'fr': 'désolé',
        'it': 'scusa'
      }
    };

    const lowerText = text.toLowerCase().trim();

    // Procurar frase no dicionário
    for (const [key, translations] of Object.entries(commonPhrases)) {
      if (lowerText.includes(key)) {
        return translations[toLang] || text;
      }
    }

    // Se não encontrar tradução, retornar texto original com indicação
    return `[${fromLang}→${toLang}] ${text}`;
  }

  // Tradução em lote
  async translateBatch(
    texts: string[],
    fromLang: string,
    toLang: string
  ): Promise<string[]> {
    const promises = texts.map(text => this.translate(text, fromLang, toLang));
    return Promise.all(promises);
  }

  // Limpar cache
  clearCache(): void {
    this.cache = {};
    console.log('Cache de traduções limpo');
  }

  // Obter tamanho do cache
  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }

  // Configurar URL da API (para usar servidor próprio)
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  // Habilitar/desabilitar fallback
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }

  // Detectar idioma do texto (básico)
  detectLanguage(text: string): string {
    // Padrões básicos para detecção de idioma
    const patterns: { [key: string]: RegExp[] } = {
      pt: [/\b(o|a|os|as|um|uma|de|para|com|em|por)\b/i],
      en: [/\b(the|a|an|is|are|was|were|have|has|of|to|in)\b/i],
      es: [/\b(el|la|los|las|un|una|de|para|con|en|por)\b/i],
      de: [/\b(der|die|das|den|dem|ein|eine|ist|sind|von|zu)\b/i],
      fr: [/\b(le|la|les|un|une|de|pour|avec|en|par)\b/i],
      it: [/\b(il|la|i|le|uno|una|di|per|con|in)\b/i]
    };

    for (const [lang, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(text)) {
          return lang;
        }
      }
    }

    return 'en'; // Padrão: inglês
  }

  // Verificar se a API está disponível
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get(this.apiUrl.replace('/translate', '/languages'), {
        timeout: 3000
      });
      return response.status === 200;
    } catch (error) {
      console.error('API de tradução não disponível:', error);
      return false;
    }
  }
}

export default new TranslationService();
