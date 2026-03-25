const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("recarga_ref");

    // ✅ Solo redirige si NO estamos ya en /login — evita bucle infinito
    const enLogin =
      window.location.pathname === "/login" ||
      window.location.pathname === "/" ||
      window.location.pathname.startsWith("/reset");

    if (!enLogin) {
      window.location.href = "/login";
    }

    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Error del servidor",
    }));
    throw errorData;
  }

  return response.json();
};
