// Typed build-time variables (vite/client is loaded via tsconfig "types").
interface ImportMetaEnv {
  // Absolute API URL for a build served from another origin, e.g.
  // "http://localhost:3000/api". Unset: same-origin "/api".
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
