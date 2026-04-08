const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `API error: ${res.status}`)
  }
  const json = await res.json()
  return json as T
}
