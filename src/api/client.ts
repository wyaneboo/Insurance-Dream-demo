const API_BASE = import.meta.env.VITE_API_URL;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
}

const buildHeaders = (extra?: Record<string, string>) => {
  const headers: Record<string, string> = extra ? { ...extra } : {};
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error("VITE_API_URL is not set; add it to your frontend .env");
  }
  const { method = "GET", body, headers } = options;
  const isFormData = body instanceof FormData;
  const finalHeaders = isFormData ? buildHeaders(headers) : buildHeaders(headers);
  if (isFormData) {
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${method} ${path} failed: ${response.status} ${text || response.statusText}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  // @ts-expect-error callers should handle non-JSON types explicitly
  return (await response.text()) as T;
}

// Convenience wrappers for common endpoints
export const api = {
  login: (identifier: string, password?: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: { id: string; role: string; name: string } }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    }),
  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST", body: { refreshToken } }),
  policies: () => apiFetch("/policies"),
  policy: (id: string) => apiFetch(`/policies/${id}`),
  tasks: () => apiFetch("/tasks"),
  claims: () => apiFetch("/claims"),
  createClaim: (payload: Record<string, unknown>) => apiFetch("/claims", { method: "POST", body: payload }),
  prospects: () => apiFetch("/prospects"),
  prospect: (id: string) => apiFetch(`/prospects/${id}`),
  createProspect: (payload: Record<string, unknown>) => apiFetch("/prospects", { method: "POST", body: payload }),
  updateProspect: (id: string, payload: Record<string, unknown>) => apiFetch(`/prospects/${id}`, { method: "PATCH", body: payload }),
  deleteProspect: (id: string) => apiFetch(`/prospects/${id}`, { method: "DELETE" }),
  pipeline: () => apiFetch("/pipeline"),
  pipelineCase: (id: string) => apiFetch(`/pipeline/${id}`),
  createPipelineCase: (payload: Record<string, unknown>) => apiFetch("/pipeline", { method: "POST", body: payload }),
  updatePipelineCase: (id: string, payload: Record<string, unknown>) => apiFetch(`/pipeline/${id}`, { method: "PATCH", body: payload }),
  deletePipelineCase: (id: string) => apiFetch(`/pipeline/${id}`, { method: "DELETE" }),
  services: () => apiFetch("/services"),
  createService: (payload: Record<string, unknown>) => apiFetch("/services", { method: "POST", body: payload }),
  notifications: () => apiFetch("/notifications"),
  rewards: () => apiFetch("/rewards"),
  redeemReward: (id: string) => apiFetch(`/rewards/${id}/redeem`, { method: "POST" }),
  vault: () => apiFetch("/vault"),
  vaultPresignUpload: (payload: Record<string, unknown>) => apiFetch("/vault/presign-upload", { method: "POST", body: payload }),
  news: () => apiFetch("/news"),
  trainings: () => apiFetch("/trainings"),
  appointments: () => apiFetch("/appointments"),
  aiAssistant: (message: string) => apiFetch<{ reply: string }>("/ai/assistant", { method: "POST", body: { message } }),
};
