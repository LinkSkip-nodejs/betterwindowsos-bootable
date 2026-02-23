/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string;
      preload?: string;
      partition?: string;
      allowpopups?: string;
    }, HTMLElement>;
  }
}

interface ElectronWifiAPI {
  scan: () => Promise<{ ssid: string; signal: number; secured: boolean; connected: boolean }[]>;
  connect: (ssid: string, password?: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  current: () => Promise<string | null>;
}

interface GoogleTokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: string }) => void;
  }) => GoogleTokenClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface Window {
  electronAPI?: {
    isElectron: boolean;
    wifi: ElectronWifiAPI;
    onOAuthCallback: (callback: (url: string) => void) => void;
  };
  google?: {
    accounts: GoogleAccounts;
  };
}
