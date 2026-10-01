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
    },

    async getFlujoCaja() {
        const res = await apiClient(`${API_BASE_URL}/dashboard/tabla/flujo-caja`);
        if (!res.ok) throw new Error("Error al cargar flujo de caja");
        return await res.json();
    },

    async registrarEgreso(data: { concepto: string; monto: number; idTipoMovimiento: number; idUsuarioRegistro: number }) {
        const res = await apiClient(`${API_BASE_URL}/operaciones/egresos`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(errorText || "Error al registrar el movimiento");
        }
        return await res.json();
    },

    async registrarAjusteCaja(data: { monto: number; concepto: string; tipoAjuste: string; idUsuario: number }) {
        const res = await apiClient(`${API_BASE_URL}/operaciones/ajuste-caja`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(errorText || "Error al registrar el ajuste");
        }
        return await res.json();
    },

    async getTotalesCaja() {
        const res = await apiClient(`${API_BASE_URL}/dashboard/flujo-caja`);
        if (!res.ok) throw new Error("Error al cargar totales de caja");
        return await res.json();
    }
};