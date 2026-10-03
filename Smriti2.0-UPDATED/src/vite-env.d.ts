/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly GEMINI_API_KEY?: string;
  readonly SMS_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
