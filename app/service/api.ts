// app/services/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request(method: string, endpoint: string, data?: any, token?: string) {
    const headers: any = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Si Spring Boot regresa 204, no hay JSON
    if (response.status === 204) return null;

    const json = await response.json();

    if (!response.ok) {
        throw new Error(json.message || "Error en la solicitud al servidor");
    }

    return json;
}

export const api = {
    get: (endpoint: string, token?: string) =>
        request("GET", endpoint, undefined, token),

    post: (endpoint: string, data: any, token?: string) =>
        request("POST", endpoint, data, token),

    put: (endpoint: string, data: any, token?: string) =>
        request("PUT", endpoint, data, token),

    delete: (endpoint: string, token?: string) =>
        request("DELETE", endpoint, undefined, token)
};
