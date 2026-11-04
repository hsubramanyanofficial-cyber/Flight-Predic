export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Record<string, Language> = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  zh: { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' }
};

// Simple client-side cache for translated strings
const translationCache: Record<string, Record<string, string>> = {};

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text;
  
  if (!translationCache[targetLang]) {
    translationCache[targetLang] = {};
  }
  if (translationCache[targetLang][text]) {
    return translationCache[targetLang][text];
  }

  try {
    const langObj = SUPPORTED_LANGUAGES[targetLang];
    const langName = langObj ? langObj.name : targetLang;

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: langName })
    });
    const data = await res.json();
    if (data.success && data.translated) {
      translationCache[targetLang][text] = data.translated;
      return data.translated;
    }
  } catch (err) {
    console.error('Translation fetch error:', err);
  }

  return text;
}
