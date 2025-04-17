import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { translations, LanguageCode, TranslationKey } from '@/constants/i18n';

interface LanguageState {
  language: LanguageCode;
  translations: Record<TranslationKey, string>;
}

interface LanguageActions {
  setLanguage: (language: LanguageCode) => void;
  translate: (key: TranslationKey) => string;
}

type LanguageStore = LanguageState & LanguageActions;

// Detect device language
const getDeviceLanguage = (): LanguageCode => {
  try {
    let deviceLanguage = 'en';

    if (Platform.OS === 'ios') {
      // iOS
      const iosSettings = NativeModules.SettingsManager?.settings;
      if (iosSettings) {
        deviceLanguage = iosSettings.AppleLocale || 
                        (iosSettings.AppleLanguages && 
                         Array.isArray(iosSettings.AppleLanguages) && 
                         iosSettings.AppleLanguages.length > 0 ? 
                         iosSettings.AppleLanguages[0] : 'en');
      }
    } else if (Platform.OS === 'android') {
      // Android
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'en';
    } else if (Platform.OS === 'web') {
      // Web
      deviceLanguage = typeof navigator !== 'undefined' ? navigator.language : 'en';
    }

    // Extract the language code (e.g., 'en' from 'en-US')
    const languageCode = deviceLanguage.toLowerCase().split(/[-_]/)[0];

    // Check if the language is supported, otherwise default to 'en'
    return (languageCode in translations) ? languageCode as LanguageCode : 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: getDeviceLanguage(),
      translations: translations[getDeviceLanguage()],

      setLanguage: (language: LanguageCode) => {
        set({
          language,
          translations: translations[language],
        });
      },

      translate: (key: TranslationKey) => {
        const { translations } = get();
        return translations[key] || key;
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);