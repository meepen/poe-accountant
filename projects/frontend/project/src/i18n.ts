import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: "/translations/{{lng}}.json",
    },
  })
  .catch((error: unknown) => {
    console.error("i18n initialization failed:", error);
  });

export default i18n;
