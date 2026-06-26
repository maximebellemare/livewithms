/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_STORE_URL?: string;
  readonly VITE_GOOGLE_PLAY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
