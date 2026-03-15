const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });

  if (response.status === 401) {
    document.cookie = 'auth_status=; Max-Age=0; Path=/';
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  return response;
}
