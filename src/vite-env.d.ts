/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PRODUCTION_URL: string
  readonly VITE_SITE_URL: string
  readonly VITE_STAGING_URL: string
  readonly VITE_OAUTH_REDIRECT_URL: string
  readonly VITE_ENABLE_OAUTH_DEBUG: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}