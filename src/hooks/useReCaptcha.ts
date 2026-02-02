import { useRef, useCallback, useState, useEffect } from "react";

// reCAPTCHA v2 Checkbox Site Key (publishable)
const RECAPTCHA_SITE_KEY = "6Ler310sAAAAAA_fWguQcl57vjtvWeMkcoxQxfC_";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: string | HTMLElement, options: object) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
      execute: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

interface UseReCaptchaReturn {
  renderRecaptcha: (containerId: string) => void;
  getToken: () => string | null;
  resetRecaptcha: () => void;
  isLoaded: boolean;
  isVerified: boolean;
}

let scriptLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (scriptLoaded && window.grecaptcha) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      if (window.grecaptcha) {
        scriptLoaded = true;
        resolve();
      } else {
        existingScript.addEventListener('load', () => {
          scriptLoaded = true;
          resolve();
        });
      }
      return;
    }

    const script = document.createElement("script");
    // Use explicit render mode for v2 checkbox
    script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    
    window.onRecaptchaLoad = () => {
      scriptLoaded = true;
      resolve();
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useReCaptcha(): UseReCaptchaReturn {
  const widgetIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(scriptLoaded);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadRecaptchaScript().then(() => {
      setIsLoaded(true);
    });
  }, []);

  const renderRecaptcha = useCallback((containerId: string) => {
    if (!isLoaded || !window.grecaptcha) {
      loadRecaptchaScript().then(() => {
        setIsLoaded(true);
        // Re-render after load
        window.grecaptcha.ready(() => {
          const container = document.getElementById(containerId);
          if (container && widgetIdRef.current === null) {
            widgetIdRef.current = window.grecaptcha.render(containerId, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: () => setIsVerified(true),
              "expired-callback": () => setIsVerified(false),
              "error-callback": () => setIsVerified(false),
            });
          }
        });
      });
      return;
    }

    window.grecaptcha.ready(() => {
      const container = document.getElementById(containerId);
      if (container && widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(containerId, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: () => setIsVerified(true),
          "expired-callback": () => setIsVerified(false),
          "error-callback": () => setIsVerified(false),
        });
      }
    });
  }, [isLoaded]);

  const getToken = useCallback((): string | null => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      const response = window.grecaptcha.getResponse(widgetIdRef.current);
      return response || null;
    }
    return null;
  }, []);

  const resetRecaptcha = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
        setIsVerified(false);
      } catch (e) {
        // Ignore reset errors
      }
    }
  }, []);

  return {
    renderRecaptcha,
    getToken,
    resetRecaptcha,
    isLoaded,
    isVerified,
  };
}

export { RECAPTCHA_SITE_KEY };
