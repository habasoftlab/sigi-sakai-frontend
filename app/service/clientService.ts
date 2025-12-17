import { Client, ClientRequest } from "@/app/types/clients";

const API_URL = process.env.NEXT_PUBLIC_USERS_API_URL;

export const ClientService = {
    
    async getAll(): Promise<Client[]> {
        const res = await fetch(`${API_URL}/clientes`);
        if (!res.ok) throw new Error("Error al obtener clientes");
        const data = await res.json();
        const listaCruda = Array.isArray(data) ? data : (data.content || []);
        return listaCruda.map((item: any) => ({
            ...item,
            id: item.idCliente,
            nombre: item.nombre || '',
            email: item.email || '',
            rfc: item.rfc || '',
        }));
    },

    async create(client: ClientRequest) {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw errorBody;
        }
        return await response.json();
    },

    async update(id: number, client: ClientRequest) {
        const response = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw errorBody;
        }
        return await response.json();
    },

    async delete(id: number) {
        const res = await fetch(`${API_URL}/clientes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar cliente");
        return true;
    }
};