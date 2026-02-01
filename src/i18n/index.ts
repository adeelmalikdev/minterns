import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

// Get saved language or detect from browser
const savedLanguage = localStorage.getItem("language");
const browserLanguage = navigator.language.split("-")[0];
const defaultLanguage = savedLanguage || (["en", "es", "fr"].includes(browserLanguage) ? browserLanguage : "en");

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper to change language and persist
export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem("language", lang);
}

export function getCurrentLanguage() {
  return i18n.language;
}
