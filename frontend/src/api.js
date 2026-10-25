const API_URL = 'http://localhost:8080';
export const AUTH_TOKEN_KEY = 'bookstore-token';
export const AUTH_EXPIRY_KEY = 'bookstore-token-expiry';

// Send requests to the Spring Boot API and surface server errors to the UI.
export async function apiRequest(path, options = {}) {
  const isAuthRequest = path.startsWith('/auth/');
  const token = isAuthRequest ? null : localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    window.dispatchEvent(new Event('auth-expired'));
  }

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText || `Request failed (${response.status})`;

    if (responseText) {
      try {
        const body = JSON.parse(responseText);
        message = body.detail || body.message || message;
      } catch {
        // Plain-text errors are already suitable for display.
      }
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.headers.get('content-type')?.includes('application/json')) {
    return response.text();
  }

  return response.json();
}
