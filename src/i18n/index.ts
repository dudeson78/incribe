import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: 'ko',
  fallbackLng: 'en',
  resources,
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
