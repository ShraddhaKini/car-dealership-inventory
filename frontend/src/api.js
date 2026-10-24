const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Error carrying the HTTP status so callers can react to 401/403/etc. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'Something went wrong', response.status);
  return data;
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  listVehicles: (token) => request('/vehicles', { token }),

  /** Uses the search endpoint when any filter is set, otherwise lists everything. */
  searchVehicles: (filters, token) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (String(value).trim() !== '') params.set(key, String(value).trim());
    });
    if (params.toString() === '') return request('/vehicles', { token });
    return request(`/vehicles/search?${params.toString()}`, { token });
  },

  createVehicle: (vehicle, token) => request('/vehicles', { method: 'POST', body: vehicle, token }),
  updateVehicle: (id, vehicle, token) => request(`/vehicles/${id}`, { method: 'PUT', body: vehicle, token }),
  deleteVehicle: (id, token) => request(`/vehicles/${id}`, { method: 'DELETE', token }),
  purchaseVehicle: (id, token) => request(`/vehicles/${id}/purchase`, { method: 'POST', body: {}, token }),
};
