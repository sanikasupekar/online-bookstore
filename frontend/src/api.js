const API_URL = 'http://localhost:8080';

// Send requests to the Spring Boot API and surface server errors to the UI.
export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

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

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.headers.get('content-type')?.includes('application/json')) {
    return response.text();
  }

  return response.json();
}
