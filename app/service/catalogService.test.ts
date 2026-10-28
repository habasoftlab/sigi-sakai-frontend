import { CatalogService } from './catalogService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('CatalogService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRegimenesFiscales', () => {
        it('debe retornar la lista de regímenes fiscales cuando la petición es exitosa', async () => {
            const mockData = [{ idRegimen: 1, clave: '601', descripcion: 'General de Ley Personas Morales' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await CatalogService.getRegimenesFiscales();

            expect(mockApiClient).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockData);
        });

        it('debe lanzar un error cuando la respuesta no es OK', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
            } as unknown as Response);

            await expect(CatalogService.getRegimenesFiscales()).rejects.toThrow('Error al cargar regímenes fiscales');
        });
    });

    describe('getProductos y getProducto', () => {
        it('debe obtener la lista de productos correctamente', async () => {
            const mockProductos = [{ idProducto: 10, nombre: 'Lona impresa' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockProductos),
            } as unknown as Response);

            const result = await CatalogService.getProductos();

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/productos'));
            expect(result).toEqual(mockProductos);
        });

        it('debe buscar productos concatenando la query string de búsqueda', async () => {
            const mockProductos = [{ idProducto: 11, nombre: 'Vinil mate' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockProductos),
            } as unknown as Response);

            const query = 'vinil';
            await CatalogService.getProducto(query);

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining(`/productos?q=${query}`));
        });
    });

    describe('Operaciones CRUD de Producto', () => {
        it('debe crear un producto enviando un POST con el body formateado', async () => {
            const nuevoProducto = { nombre: 'Gafete plástico', precio: 50 };
            const productoCreado = { idProducto: 1, ...nuevoProducto };

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(productoCreado),
            } as unknown as Response);

            const result = await CatalogService.createProducto(nuevoProducto);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/productos'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(nuevoProducto),
                })
            );
            expect(result).toEqual(productoCreado);
        });

        it('debe actualizar un producto mediante un PUT', async () => {
            const id = 5;
            const productoActualizado = { nombre: 'Gafete PVC premium' };

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ idProducto: id, ...productoActualizado }),
            } as unknown as Response);

            await CatalogService.updateProducto(id, productoActualizado);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/productos/${id}`),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(productoActualizado),
                })
            );
        });

        it('debe eliminar un producto mediante un DELETE y retornar true', async () => {
            const id = 5;
            mockApiClient.mockResolvedValueOnce({
                ok: true,
            } as unknown as Response);

            const result = await CatalogService.deleteProducto(id);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/productos/${id}`),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(result).toBe(true);
        });

        it('debe lanzar un error al fallar la eliminación de un producto', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
            } as unknown as Response);

            await expect(CatalogService.deleteProducto(99)).rejects.toThrow('Error al eliminar producto');
        });
    });
    describe('Catálogos Operativos Adicionales', () => {
        it('debe obtener condiciones de pago', async () => {
            const mockData = [{ idCondicion: 1, descripcion: 'Contado' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData)
            } as unknown as Response);

            const res = await CatalogService.getCondicionesPago();
            expect(res).toEqual(mockData);
        });

        it('debe lanzar error al fallar condiciones de pago', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(CatalogService.getCondicionesPago()).rejects.toThrow('Error al cargar condiciones de pago');
        });

        it('debe obtener usos CFDI', async () => {
            const mockData = [{ idUso: 1, descripcion: 'Gastos en general' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData)
            } as unknown as Response);

            const res = await CatalogService.getUsosCfdi();
            expect(res).toEqual(mockData);
        });

        it('debe lanzar error al fallar usos CFDI', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(CatalogService.getUsosCfdi()).rejects.toThrow('Error al cargar usos CFDI');
        });

        it('debe obtener razones de cancelación', async () => {
            const mockData = [{ idRazon: 1, motivo: 'Error en pedido' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData)
            } as unknown as Response);

            const res = await CatalogService.getRazonesCancelacion();
            expect(res).toEqual(mockData);
        });

        it('debe lanzar error al fallar razones de cancelación', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(CatalogService.getRazonesCancelacion()).rejects.toThrow('Error al cargar razones de cancelación');
        });

        it('debe obtener estatus de solicitud', async () => {
            const mockData = [{ idEstatus: 1, nombre: 'Pendiente' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData)
            } as unknown as Response);

            const res = await CatalogService.getEstatusSolicitud();
            expect(res).toEqual(mockData);
        });

        it('debe lanzar error al fallar estatus de solicitud', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(CatalogService.getEstatusSolicitud()).rejects.toThrow('Error al cargar estatus');
        });

        it('debe obtener tipos de movimiento', async () => {
            const mockData = [{ idTipo: 1, descripcion: 'Ingreso' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData)
            } as unknown as Response);

            const res = await CatalogService.getTiposMovimiento();
            expect(res).toEqual(mockData);
        });

        it('debe lanzar error al fallar tipos de movimiento', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(CatalogService.getTiposMovimiento()).rejects.toThrow('Error al cargar tipos de movimiento');
        });

        it('debe obtener todos los productos mediante getAllProductos', async () => {
            const mockData = [{ idProducto: 1, nombre: 'Producto All' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData)
            } as unknown as Response);

            const res = await CatalogService.getAllProductos();
            expect(res).toEqual(mockData);
        });

        it('debe lanzar error en getAllProductos si la llamada falla', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(CatalogService.getAllProductos()).rejects.toThrow('Error al cargar los productos');
        });
    });
});