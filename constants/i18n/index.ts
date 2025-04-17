import { en } from './en';
import { ja } from './ja';
import { zh } from './zh';

export type TranslationKey = keyof typeof en;

export const translations = {
  en,
  ja,
  zh,
};

export type LanguageCode = keyof typeof translations;

export const languageNames = {
  en: {
    name: 'English',
    nativeName: 'English',
    region: 'United States',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    region: 'Japan',
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    region: 'China',
  },
};