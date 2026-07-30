
export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('token');
    if (!token) {
        const userStr = localStorage.getItem('user');
        token = userStr ? JSON.parse(userStr).token : null;
    }

    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        console.warn("Token inválido o expirado. Redirigiendo al login...");
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }

        throw new Error("Sesión expirada");
    }

    return response;
};