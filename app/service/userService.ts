import { apiClient } from "./apiClient";

export interface NuevoUsuario {
    nombre: string;
    email: string;
    password: string;
    rol: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const UserService = {
    async getAll() {
        const res = await apiClient(`${API_BASE_URL}/usuarios`);
        if (!res.ok) throw new Error("Error al obtener usuarios");
        return await res.json();
    },

    async getDesigners() {
        const res = await apiClient(`${API_BASE_URL}/usuarios/disenadores`);
        if (!res.ok) throw new Error("Error al obtener lista de diseñadores");
        return await res.json();
    }
};

export async function registrarUsuario(data: NuevoUsuario) {
    if (!API_BASE_URL) {
        throw new Error("La URL de la API no está configurada en las variables de entorno");
    }

    try {
        const response = await apiClient(`${API_BASE_URL}/usuarios`, {
            method: "POST",
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.text().catch(() => null);
            throw new Error(errorData || "Error al registrar usuario");
        }
        return await response.json();
        
    } catch (error) {
        console.error("Error en servicio registrarUsuario:", error);
        throw error;
    }
}