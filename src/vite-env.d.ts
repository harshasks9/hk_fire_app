/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional per-deployment override for the workspace access key. */
  readonly VITE_ACCESS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
