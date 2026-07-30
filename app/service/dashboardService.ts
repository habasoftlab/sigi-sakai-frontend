import { apiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const DashboardService = {
    async getCotizacionesGrafica(filtro: string) {
        const res = await apiClient(`${API_BASE_URL}/dashboard/cotizaciones/grafica?filtro=${filtro}`);
        if (!res.ok) throw new Error("Error al cargar gráfica de cotizaciones");
        return await res.json();
    },

    async getOrdenesGrafica(filtro: string) {
        const res = await apiClient(`${API_BASE_URL}/dashboard/ordenes/grafica?filtro=${filtro}`);
        if (!res.ok) throw new Error("Error al cargar gráfica de órdenes");
        return await res.json();
    },

    async getEgresosGrafica(filtro: string) {
        const res = await apiClient(`${API_BASE_URL}/dashboard/egresos/grafica?filtro=${filtro}`);
        if (!res.ok) throw new Error("Error al cargar gráfica de egresos");
        return await res.json();
    },

    async getIngresosGrafica(filtro: string) {
        const res = await apiClient(`${API_BASE_URL}/dashboard/ingresos/grafica?filtro=${filtro}`);
        if (!res.ok) throw new Error("Error al cargar gráfica de ingresos");
        return await res.json();
    }
};