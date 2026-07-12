/**
 * Thin client-side fetch wrapper around the standard `{ ok, data, error }`
 * API envelope. Throws an Error with the server message on failure so callers
 * can `try/catch` and surface a toast.
 */

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("Unexpected server response.");
  }
  if (!res.ok || !json.ok) {
    throw new Error(json?.error?.message ?? "Request failed. Please try again.");
  }
  return json.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  /** Multipart upload — do not set Content-Type (browser adds the boundary). */
  upload: <T>(url: string, form: FormData) =>
    request<T>(url, { method: "POST", body: form, headers: {} }),
};
