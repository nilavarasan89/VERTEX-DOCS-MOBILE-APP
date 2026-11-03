/**
 * Vertex Docs Mobile - Supported Languages
 * Company: JM Vertex Technologies
 */

import { LanguageItem, LanguageCode } from '../types/translator';

export const SUPPORTED_LANGUAGES: LanguageItem[] = [
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    isPopular: true,
    supportsOcr: true,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US/UK)',
    flag: '🇬🇧',
    isPopular: true,
    supportsOcr: true,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    isPopular: true,
    supportsOcr: true,
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    isPopular: false,
    supportsOcr: true,
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    isPopular: false,
    supportsOcr: true,
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    isPopular: false,
    supportsOcr: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    isPopular: false,
    supportsOcr: true,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    isPopular: false,
    supportsOcr: true,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    isPopular: false,
    supportsOcr: true,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇦🇪',
    isPopular: false,
    supportsOcr: true,
  },
];

export const SOURCE_LANGUAGES: LanguageItem[] = [
  {
    code: 'auto',
    name: 'Auto Detect',
    nativeName: 'Detect automatically',
    flag: '✨',
    isPopular: true,
    supportsOcr: true,
  },
  ...SUPPORTED_LANGUAGES,
];

export function getLanguageByCode(code: LanguageCode): LanguageItem {
  if (code === 'auto') {
    return {
      code: 'auto',
      name: 'Auto Detect',
      nativeName: 'Detect automatically',
      flag: '✨',
    };
  }
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return (
    found || {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      flag: '🌐',
    }
  );
}

/**
 * Intelligent client-side script detector
 */
export function detectLanguageFromText(text: string): LanguageCode {
  if (!text || text.trim().length === 0) return 'en';

  // Tamil Unicode Range: \u0B80-\u0BFF
  const tamilRegex = /[\u0B80-\u0BFF]/g;
  const tamilMatches = text.match(tamilRegex);
  if (tamilMatches && tamilMatches.length > 5) {
    return 'ta';
  }

  // Devanagari (Hindi) Unicode Range: \u0900-\u097F
  const hindiRegex = /[\u0900-\u097F]/g;
  if (text.match(hindiRegex)) return 'hi';

  // Telugu Unicode Range: \u0C00-\u0C7F
  const teluguRegex = /[\u0C00-\u0C7F]/g;
  if (text.match(teluguRegex)) return 'te';

  // Malayalam Unicode Range: \u0D00-\u0D7F
  const malayalamRegex = /[\u0D00-\u0D7F]/g;
  if (text.match(malayalamRegex)) return 'ml';

  // Kannada Unicode Range: \u0C80-\u0CFF
  const kannadaRegex = /[\u0C80-\u0CFF]/g;
  if (text.match(kannadaRegex)) return 'kn';

  // Arabic Unicode Range: \u0600-\u06FF
  const arabicRegex = /[\u0600-\u06FF]/g;
  if (text.match(arabicRegex)) return 'ar';

  return 'en';
}
