import { ClientService } from './clientService';
import { apiClient } from './apiClient';
import { ClientRequest, TipoClienteFiltro } from '@/app/types/clients';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('ClientService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('debe solicitar todos los clientes y mapear/normalizar las propiedades cuando no se especifica tipo', async () => {
            const rawData = [
                { idCliente: 101, nombre: 'Empresa A', email: 'contacto@a.com', rfc: 'XAXX010101000' },
                { id: 102, nombre: 'Cliente B' }
            ];

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(rawData),
            } as unknown as Response);

            const result = await ClientService.getAll();

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/clientes'));
            expect(result).toEqual([
                { idCliente: 101, id: 101, nombre: 'Empresa A', email: 'contacto@a.com', rfc: 'XAXX010101000' },
                { id: 102, nombre: 'Cliente B', email: '', rfc: '' }
            ]);
        });

        it('debe incluir la query string cuando se proporciona un tipo diferente de "todos"', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce([]),
            } as unknown as Response);

            await ClientService.getAll('frecuente' as TipoClienteFiltro);

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/clientes/filtrar?tipo=frecuente'));
        });
    });

    it('no debe incluir query string cuando tipo es "todos"', async () => {
        mockApiClient.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce([]),
        } as unknown as Response);

        await ClientService.getAll('todos');

        expect(mockApiClient).toHaveBeenCalledWith(expect.not.stringContaining('?tipo='));
    });

    it('debe manejar estructuras paginadas con propiedad content', async () => {
        const paginatedData = {
            content: [{ idCliente: 5, nombre: 'Cliente Paginado' }]
        };

        mockApiClient.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(paginatedData),
        } as unknown as Response);

        const result = await ClientService.getAll();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(5);
    });

    it('debe lanzar un error si la petición no es exitosa', async () => {
        mockApiClient.mockResolvedValueOnce({
            ok: false,
        } as unknown as Response);

        await expect(ClientService.getAll()).rejects.toThrow('Error al obtener clientes');
    });
});

describe('getById y getUltimaCompra', () => {
    it('debe obtener un cliente por id', async () => {
        const mockClient = { id: 1, nombre: 'Juan Pérez' };
        mockApiClient.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(mockClient),
        } as unknown as Response);

        const result = await ClientService.getById(1);

        expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/clientes/1'));
        expect(result).toEqual(mockClient);
    });

    it('debe lanzar error cuando no se encuentra el cliente por id', async () => {
        mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);

        await expect(ClientService.getById(999)).rejects.toThrow('No se pudo obtener el cliente');
    });

    it('debe obtener la última compra del cliente', async () => {
        const mockUltimaCompra = { idOrden: 50, fecha: '2026-10-01', total: 1500 };
        mockApiClient.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(mockUltimaCompra),
        } as unknown as Response);

        const result = await ClientService.getUltimaCompra(1);

        expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/clientes/1/ultima-compra'));
        expect(result).toEqual(mockUltimaCompra);
    });
});

describe('Operaciones de escritura (create, update, delete)', () => {
    const payload: ClientRequest = {
        nombre: 'Nuevo Cliente',
        email: 'nuevo@cliente.com',
        telefono: '1234567890',
        rfc: 'XAXX010101000',
        razonSocial: 'Razon Social SA',
        direccionFiscal: 'Av. Principal 123',
        idUsoCfdi: 1,
        idRegimenFiscal: 601
    };

    it('debe crear un cliente mediante un POST', async () => {
        const responseData = { id: 10, ...payload };
        mockApiClient.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(responseData),
        } as unknown as Response);

        const result = await ClientService.create(payload);

        expect(mockApiClient).toHaveBeenCalledWith(
            expect.stringContaining('/clientes'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(payload)
            })
        );
        expect(result).toEqual(responseData);
    });

    it('debe lanzar el cuerpo de error si la creación falla', async () => {
        const errorBody = { message: 'El RFC ya existe' };
        mockApiClient.mockResolvedValueOnce({
            ok: false,
            json: jest.fn().mockResolvedValueOnce(errorBody),
        } as unknown as Response);

        await expect(ClientService.create(payload)).rejects.toEqual(errorBody);
    });

    it('debe actualizar un cliente existente mediante un PUT', async () => {
        const updatedData = { id: 10, ...payload, nombre: 'Cliente Actualizado' };
        mockApiClient.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(updatedData),
        } as unknown as Response);

        const result = await ClientService.update(10, payload);

        expect(mockApiClient).toHaveBeenCalledWith(
            expect.stringContaining('/clientes/10'),
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify(payload)
            })
        );
        expect(result).toEqual(updatedData);
    });

    it('debe eliminar un cliente mediante DELETE', async () => {
        mockApiClient.mockResolvedValueOnce({
            ok: true
        } as unknown as Response);

        const result = await ClientService.delete(10);

        expect(mockApiClient).toHaveBeenCalledWith(
            expect.stringContaining('/clientes/10'),
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(result).toBe(true);
    });
});