import { useEffect } from "react";

/**
 * Development-only accessibility checker that logs common issues to console
 */
export function A11yChecker() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Delay check to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const issues: string[] = [];

        // Check for images without alt text
        const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
        if (imagesWithoutAlt.length > 0) {
          issues.push(`⚠️ ${imagesWithoutAlt.length} images missing alt text`);
        }

        // Check for buttons without accessible names
        const buttonsWithoutLabel = document.querySelectorAll(
          "button:not([aria-label]):not(:has(span)):not(:has(.sr-only))"
        );
        const iconOnlyButtons = Array.from(buttonsWithoutLabel).filter(
          (btn) => !btn.textContent?.trim() || btn.querySelector("svg")
        );
        if (iconOnlyButtons.length > 0) {
          issues.push(`⚠️ ${iconOnlyButtons.length} icon buttons may need aria-label`);
        }

        // Check for form inputs without labels
        const inputsWithoutLabels = document.querySelectorAll(
          "input:not([aria-label]):not([aria-labelledby]):not([id])"
        );
        if (inputsWithoutLabels.length > 0) {
          issues.push(`⚠️ ${inputsWithoutLabels.length} inputs without associated labels`);
        }

        // Check for missing heading hierarchy
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        let lastLevel = 0;
        headings.forEach((heading) => {
          const level = parseInt(heading.tagName[1]);
          if (level > lastLevel + 1 && lastLevel !== 0) {
            issues.push(`⚠️ Heading hierarchy skip: h${lastLevel} → h${level}`);
          }
          lastLevel = level;
        });

        // Check for links without href
        const emptyLinks = document.querySelectorAll("a:not([href])");
        if (emptyLinks.length > 0) {
          issues.push(`⚠️ ${emptyLinks.length} links missing href attribute`);
        }

        // Log issues
        if (issues.length > 0) {
          console.group("🔍 Accessibility Check");
          issues.forEach((issue) => console.warn(issue));
          console.groupEnd();
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  return null;
}
