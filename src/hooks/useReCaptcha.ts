import { useRef, useCallback } from "react";

// reCAPTCHA v2 Site Key (publishable)
const RECAPTCHA_SITE_KEY = "6LcWcl0sAAAAAL3Vq64KS_sNGEuKRXDEKL51SIqU";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: string | HTMLElement, options: object) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onRecaptchaLoad?: () => void;
  }
}

interface UseReCaptchaReturn {
  executeRecaptcha: () => Promise<string | null>;
  resetRecaptcha: () => void;
  isLoaded: boolean;
}

let scriptLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useReCaptcha(): UseReCaptchaReturn {
  const widgetIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resolverRef = useRef<((token: string) => void) | null>(null);

  const executeRecaptcha = useCallback(async (): Promise<string | null> => {
    try {
      await loadRecaptchaScript();

      return new Promise((resolve) => {
        window.grecaptcha.ready(() => {
          // Create hidden container if needed
          if (!containerRef.current) {
            containerRef.current = document.createElement("div");
            containerRef.current.style.display = "none";
            document.body.appendChild(containerRef.current);
          }

          // Render widget if not already rendered
          if (widgetIdRef.current === null) {
            resolverRef.current = resolve;
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              size: "invisible",
              callback: (token: string) => {
                if (resolverRef.current) {
                  resolverRef.current(token);
                  resolverRef.current = null;
                }
              },
              "error-callback": () => {
                resolve(null);
              },
            });
          } else {
            resolverRef.current = resolve;
            window.grecaptcha.reset(widgetIdRef.current);
          }

          // Execute the challenge
          const checkbox = containerRef.current?.querySelector("iframe");
          if (checkbox) {
            checkbox.click();
          }
        });
      });
    } catch (error) {
      console.error("reCAPTCHA error:", error);
      return null;
    }
  }, []);

  const resetRecaptcha = useCallback(() => {
    if (widgetIdRef.current !== null) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (e) {
        // Ignore reset errors
      }
    }
  }, []);

  return {
    executeRecaptcha,
    resetRecaptcha,
    isLoaded: scriptLoaded,
  };
}

export { RECAPTCHA_SITE_KEY };
