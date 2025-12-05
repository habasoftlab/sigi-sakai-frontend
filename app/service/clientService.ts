import { Client, ClientRequest } from "@/app/types/clients";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const ClientService = {
    async getAll(): Promise<Client[]> {
        if (!API_URL) throw new Error("API URL no configurada");
        
        const res = await fetch(`${API_URL}/clientes`);
        if (!res.ok) throw new Error("Error al obtener clientes");
        return await res.json();
    },

    async create(client: ClientRequest): Promise<Client> {
        const res = await fetch(`${API_URL}/clientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(client)
        });
        if (!res.ok) throw new Error("Error al crear cliente");
        return await res.json();
    },

    async update(id: number, client: ClientRequest): Promise<Client> {
        const res = await fetch(`${API_URL}/clientes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(client)
        });
        if (!res.ok) throw new Error("Error al actualizar cliente");
        return await res.json();
    },

    async delete(id: number): Promise<boolean> {
        const res = await fetch(`${API_URL}/clientes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar cliente");
        return true;
    }
};