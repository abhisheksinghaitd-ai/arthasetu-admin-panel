// ---------------------------------------------------------------
// Minimal API client for the ArthaSetu Admin backend (FastAPI).
// Set VITE_API_URL in .env to override (defaults to localhost:8000).
// ---------------------------------------------------------------
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8000";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    sessionStorage.setItem("arthasetu_token", token);
  } else {
    sessionStorage.removeItem("arthasetu_token");
  }
}

export function loadStoredToken() {
  authToken = sessionStorage.getItem("arthasetu_token");
  return authToken;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ---- Auth ----
  login: (email, password, role) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }) }),
  listRoles: () => request("/auth/roles"),

  // ---- Dashboard ----
  kpis: () => request("/admin/dashboard/kpis"),

  // ---- Users ----
  listUsers: (params = {}) => request(`/admin/users?${new URLSearchParams(params)}`),
  getUser: (userRef) => request(`/admin/users/${userRef}`),
  blockUser: (userRef, reason) =>
    request(`/admin/users/${userRef}/block`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  unblockUser: (userRef) => request(`/admin/users/${userRef}/unblock`, { method: "PATCH" }),

  // ---- Partners ----
  listPartners: (params = {}) => request(`/admin/partners?${new URLSearchParams(params)}`),
  getPartner: (partnerRef) => request(`/admin/partners/${partnerRef}`),
  getPartnerPerformance: (partnerRef) => request(`/admin/partners/${partnerRef}/performance`),
  suspendPartner: (partnerRef, reason) =>
    request(`/admin/partners/${partnerRef}/suspend`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  reinstatePartner: (partnerRef) => request(`/admin/partners/${partnerRef}/reinstate`, { method: "PATCH" }),
  suspensionImpact: (partnerRef) => request(`/admin/partners/${partnerRef}/suspension-impact`),

  // ---- Schemes ----
  listSchemes: (params = {}) => request(`/admin/schemes?${new URLSearchParams(params)}`),
  getScheme: (schemeId) => request(`/admin/schemes/${schemeId}`),
  createScheme: (payload) => request("/admin/schemes", { method: "POST", body: JSON.stringify(payload) }),
  updateScheme: (schemeId, payload) =>
    request(`/admin/schemes/${schemeId}`, { method: "PUT", body: JSON.stringify(payload) }),
  publishScheme: (schemeId) => request(`/admin/schemes/${schemeId}/publish`, { method: "POST" }),
  schemeVersions: (schemeId) => request(`/admin/schemes/${schemeId}/versions`),

  // ---- Applications ----
  listApplications: (params = {}) => request(`/admin/applications?${new URLSearchParams(params)}`),
  getApplication: (ref) => request(`/admin/applications/${ref}`),

  // ---- Reports ----
  utilizationReport: () => request("/admin/reports/utilization"),
  npaReport: () => request("/admin/reports/npa"),
  partnerPerformanceReport: () => request("/admin/reports/partner-performance"),
  stateReachReport: () => request("/admin/reports/state-reach"),

  // ---- Audit ----
  listAuditLog: (params = {}) => request(`/admin/audit-log?${new URLSearchParams(params)}`),

  // ---- Grievances ----
  listGrievances: (params = {}) => request(`/admin/grievances?${new URLSearchParams(params)}`),
  resolveGrievance: (ref, note) =>
    request(`/admin/grievances/${ref}/resolve`, { method: "PATCH", body: JSON.stringify({ resolution_note: note }) }),
};

export { API_BASE };
