const DEFAULT_BACKEND_URL = "http://localhost:5000"

export function getBackendBaseUrl() {
  const value = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!value) return DEFAULT_BACKEND_URL
  return value.replace(/\/$/, "")
}

export function buildBackendUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getBackendBaseUrl()}${normalizedPath}`
}
