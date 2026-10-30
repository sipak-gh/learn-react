// Types for our own environment variables (see .env). Vite's built-in ones,
// such as import.meta.env.DEV, come from "vite/client" (tsconfig.app.json).

interface ViteTypeOptions {
  // Make import.meta.env strict: a typo such as VITE_LEADERBORD_LATENCY is an error.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  /** Average delay of the fake leaderboard server, in milliseconds. */
  readonly VITE_LEADERBOARD_LATENCY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
