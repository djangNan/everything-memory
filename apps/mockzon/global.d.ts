export {};

declare global {
  interface Window {
    EM?: {
      init: (config: { apiKey: string; apiBase: string }) => void;
      identify: (email: string) => Promise<void>;
      track: (eventType: string, props?: Record<string, unknown>) => Promise<void>;
      setDemographics: (d: Record<string, unknown>) => Promise<void>;
    };
  }
}
