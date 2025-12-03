export interface NuevoUsuario {
    nombre: string;
    email: string;
    password: string;
    rol: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function registrarUsuario(data: NuevoUsuario) {
    if (!API_URL) {
        throw new Error("La URL de la API no está configurada en las variables de entorno");
    }

    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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