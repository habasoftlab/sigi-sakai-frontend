// src/app/service/catalogService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const catalogService = {
    // 5.1 Buscar productos (para un AutoComplete)
    async buscarProductos(query: string) {
        const res = await fetch(`${API_URL}/operaciones/productos?q=${query}`);
        if (!res.ok) throw new Error('Error al buscar productos');
        return await res.json();
    },

    // 5.2 Obtener condiciones de pago (para un Dropdown)
    async getCondicionesPago() {
        const res = await fetch(`${API_URL}/operaciones/condiciones-pago`);
        if (!res.ok) throw new Error('Error al obtener condiciones');
        return await res.json();
    }
};