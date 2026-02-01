import { describe, it, expect } from "vitest";

describe("i18n translations", () => {
  it("should have English translations", async () => {
    const en = await import("@/i18n/locales/en.json");
    
    expect(en.default.common.submit).toBe("Submit");
    expect(en.default.auth.signIn).toBe("Sign In");
    expect(en.default.settings.twoFactor).toBe("Two-Factor Authentication");
  });
  
  it("should have Spanish translations", async () => {
    const es = await import("@/i18n/locales/es.json");
    
    expect(es.default.common.submit).toBe("Enviar");
    expect(es.default.auth.signIn).toBe("Iniciar Sesión");
  });
  
  it("should have French translations", async () => {
    const fr = await import("@/i18n/locales/fr.json");
    
    expect(fr.default.common.submit).toBe("Soumettre");
    expect(fr.default.auth.signIn).toBe("Se Connecter");
  });
});

describe("Component imports", () => {
  it("should import TwoFactorSetup component", async () => {
    const module = await import("@/components/auth/TwoFactorSetup");
    expect(module.TwoFactorSetup).toBeDefined();
  });
  
  it("should import AvatarUpload component", async () => {
    const module = await import("@/components/profile/AvatarUpload");
    expect(module.AvatarUpload).toBeDefined();
  });
  
  it("should import DataExportButton component", async () => {
    const module = await import("@/components/settings/DataExportButton");
    expect(module.DataExportButton).toBeDefined();
  });
  
  it("should import AccountDeletionDialog component", async () => {
    const module = await import("@/components/settings/AccountDeletionDialog");
    expect(module.AccountDeletionDialog).toBeDefined();
  });
  
  it("should import LanguageSwitcher component", async () => {
    const module = await import("@/components/LanguageSwitcher");
    expect(module.LanguageSwitcher).toBeDefined();
  });
});

describe("Hooks", () => {
  it("should import useTwoFactor hook", async () => {
    const module = await import("@/hooks/useTwoFactor");
    expect(module.useTwoFactor).toBeDefined();
  });
});

describe("Service Worker", () => {
  it("should export registerServiceWorker function", async () => {
    const module = await import("@/lib/serviceWorker");
    expect(module.registerServiceWorker).toBeDefined();
    expect(module.unregisterServiceWorker).toBeDefined();
    expect(module.requestNotificationPermission).toBeDefined();
  });
});
