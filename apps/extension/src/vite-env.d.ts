interface ImportMetaEnv {
  readonly VITE_API_PREFIX?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly NODE_ENV?: string;
  readonly VITE_GOOGLE_EXTENSION_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
