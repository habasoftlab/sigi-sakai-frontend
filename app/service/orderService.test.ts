import { OrderService } from './orderService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('OrderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080/api';
        process.env.NEXT_PUBLIC_IMAGE_API_URL = 'http://localhost:8080/images';
    });

    describe('Operaciones de Creación y Modificación', () => {
        it('debe crear una orden enviando los datos por POST', async () => {
            const nuevaOrden = { idCliente: 1, detalles: [] } as any;
            const mockRespuesta = { idOrden: 10, ...nuevaOrden };

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockRespuesta),
            } as unknown as Response);

            const result = await OrderService.crearOrden(nuevaOrden);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/ordenes'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(nuevaOrden),
                })
            );
            expect(result).toEqual(mockRespuesta);
        });

        it('debe cancelar una orden y lanzar el error adecuado cuando falla', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockResolvedValueOnce({ message: 'La orden ya está entregada' }),
            } as unknown as Response);

            await expect(OrderService.cancelarOrden(10, 1, 5)).rejects.toThrow(
                'La orden ya está entregada'
            );
        });

        it('debe actualizar la condición de pago correctamente', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: true,
            } as unknown as Response);

            const result = await OrderService.updateCondicionPago(10, 2);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/ordenes/10/condicion-pago'),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ idCondicionPago: 2 }),
                })
            );
            expect(result).toBe(true);
        });

        it('debe actualizar las notas de diseño', async () => {
            const notas = 'Ajustar color a CMYK';
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ idOrden: 10, notasDiseno: notas }),
            } as unknown as Response);

            const result = await OrderService.updateNotasDiseno(10, notas);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/ordenes/10/notas-diseno'),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ notasDiseno: notas }),
                })
            );
            expect(result).toEqual({ idOrden: 10, notasDiseno: notas });
        });
    });

    describe('Manejo de Archivos e Imágenes', () => {
        it('debe subir un archivo usando FormData', async () => {
            const mockFile = new File(['dummy content'], 'diseno.png', { type: 'image/png' });
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ filename: 'diseno.png' }),
            } as unknown as Response);

            await OrderService.subirArchivo(10, mockFile);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/ordenes/10/archivo'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );
        });

        it('debe retornar null en getArchivoUrlVerificado si el nombre de archivo es nulo, vacío o "Pendiente"', async () => {
            expect(await OrderService.getArchivoUrlVerificado(null)).toBeNull();
            expect(await OrderService.getArchivoUrlVerificado('')).toBeNull();
            expect(await OrderService.getArchivoUrlVerificado('Pendiente')).toBeNull();
        });

        it('debe retornar la URL de objeto del blob cuando se obtiene la imagen verificada', async () => {
            const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                blob: jest.fn().mockResolvedValueOnce(mockBlob),
            } as unknown as Response);

            const originalCreateObjectURL = URL.createObjectURL;
            URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/test-uuid');

            const url = await OrderService.getArchivoUrlVerificado('muestra.jpg');

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/uploads/muestra.jpg'));
            expect(url).toBe('blob:http://localhost/test-uuid');

            URL.createObjectURL = originalCreateObjectURL;
        });

        it('debe retornar null si el nombre contiene solamente espacios', async () => {
            await expect(
                OrderService.getArchivoUrlVerificado('   ')
            ).resolves.toBeNull();

            expect(mockApiClient).not.toHaveBeenCalled();
        });

        it('debe retornar null si la respuesta de la imagen no es exitosa', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
            } as Response);

            await expect(
                OrderService.getArchivoUrlVerificado('inexistente.png')
            ).resolves.toBeNull();
        });

        it('debe retornar null y registrar el error si falla la petición de imagen', async () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            mockApiClient.mockRejectedValueOnce(new Error('Error de conexión'));

            await expect(
                OrderService.getArchivoUrlVerificado('diseno.png')
            ).resolves.toBeNull();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error al obtener la imagen:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Consultas y Listados Paginados', () => {
        it('debe obtener la lista general de órdenes con los parámetros de paginación', async () => {
            const mockData = { content: [], totalElements: 0 };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await OrderService.getOrdenes(1, 20);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringMatching(/\/ordenes\?page=1&size=20&sort=idOrden/)
            );
            expect(result).toEqual(mockData);
        });

        it('debe obtener órdenes por diseñador con paginación', async () => {
            const mockData = { content: [{ idOrden: 1 }] };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await OrderService.getOrdenesPorDisenador(5, 0, 10);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/ordenes/por-disenador/5?page=0&size=10')
            );
            expect(result).toEqual(mockData);
        });
    });
    describe('Operaciones Adicionales de Ordenes', () => {
        it('debe registrar un pago correctamente', async () => {
            const pagoPayload = { monto: 500, referencia: 'REF123', idUsuario: 1 };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ idPago: 1, ...pagoPayload })
            } as unknown as Response);

            const res = await OrderService.registrarPago(10, pagoPayload);
            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/ordenes/10/pagos'),
                expect.objectContaining({ method: 'POST', body: JSON.stringify(pagoPayload) })
            );
            expect(res).toEqual({ idPago: 1, ...pagoPayload });
        });

        it('debe lanzar error si falla el registro de pago', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);
            await expect(OrderService.registrarPago(10, { monto: 10, referencia: '', idUsuario: 1 })).rejects.toThrow('Error al registrar pago');
        });

        it('debe avanzar el estatus de una orden', async () => {
            const body = { idEstatus: 2, idUsuario: 1 };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ idOrden: 10, idEstatus: 2 })
            } as unknown as Response);

            const res = await OrderService.avanzarEstatus(10, body as any);
            expect(res).toEqual({ idOrden: 10, idEstatus: 2 });
        });

        it('debe crear una solicitud de compra', async () => {
            const data = { idOrden: 10, items: [] };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({ idSolicitud: 1 })
            } as unknown as Response);

            const res = await OrderService.crearSolicitudCompra(data);
            expect(res).toEqual({ idSolicitud: 1 });
        });

        it('debe obtener el historial de una orden', async () => {
            const mockHistorial = [{ idHistorial: 1, cambio: 'Estatus a IMPRESION' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockHistorial)
            } as unknown as Response);

            const res = await OrderService.getHistorial(10);
            expect(res).toEqual(mockHistorial);
        });

        it('debe obtener razones de cancelación desde OrderService', async () => {
            const mockRazones = [{ idRazon: 1, motivo: 'Error cliente' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockRazones)
            } as unknown as Response);

            const res = await OrderService.getRazonesCancelacion();
            expect(res).toEqual(mockRazones);
        });

        it('debe obtener una orden por ID', async () => {
            const mockOrden = { idOrden: 10, total: 1000 };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockOrden)
            } as unknown as Response);

            const res = await OrderService.getOrdenById(10);
            expect(res).toEqual(mockOrden);
        });

        it('debe obtener órdenes activas con paginación', async () => {
            const mockActivas = { content: [{ idOrden: 1 }] };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockActivas)
            } as unknown as Response);

            const res = await OrderService.getOrdenesActivas(0, 10);
            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/ordenes/activas?page=0&size=10'));
            expect(res).toEqual(mockActivas);
        });

        it('debe obtener cotizaciones y canceladas con paginación', async () => {
            const mockCotizaciones = { content: [{ idOrden: 2 }] };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockCotizaciones)
            } as unknown as Response);

            const res = await OrderService.getCotizacionesYCanceladas(0, 10);
            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/ordenes/cotizacion-cancelacion?page=0&size=10'));
            expect(res).toEqual(mockCotizaciones);
        });

        it('debe obtener catálogo de estatus de operaciones', async () => {
            const mockEstatus = [{ idEstatus: 1, nombre: 'NUEVA' }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockEstatus)
            } as unknown as Response);

            const res = await OrderService.getEstatusOperaciones();
            expect(res).toEqual(mockEstatus);
        });
    });

    describe('Manejo de errores en operaciones de escritura', () => {
        it('debe lanzar un error al fallar la creación de una orden', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
            } as Response);

            await expect(
                OrderService.crearOrden({ idCliente: 1, detalles: [] } as any)
            ).rejects.toThrow('Error al crear la orden');
        });

        it('debe usar el mensaje genérico si falla la respuesta al cancelar', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockRejectedValue(new Error('JSON inválido')),
            } as unknown as Response);

            await expect(
                OrderService.cancelarOrden(10, 1, 5)
            ).rejects.toThrow('Error al cancelar la orden');
        });

        it('debe lanzar un error al actualizar la condición de pago', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockResolvedValue({ message: 'Error del servidor' }),
            } as unknown as Response);

            await expect(
                OrderService.updateCondicionPago(10, 2)
            ).rejects.toThrow('No se pudo actualizar la condición de pago');
        });

        it('debe lanzar un error al actualizar las notas de diseño', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false,
            } as Response);

            await expect(
                OrderService.updateNotasDiseno(10, 'Cambiar colores')
            ).rejects.toThrow('Error al actualizar notas de diseño');
        });

        it('debe lanzar un error cuando falla la subida de un archivo', async () => {
            const archivo = new File(['contenido'], 'diseno.png', {
                type: 'image/png',
            });

            mockApiClient.mockResolvedValueOnce({
                ok: false,
            } as Response);

            await expect(
                OrderService.subirArchivo(10, archivo)
            ).rejects.toThrow('Error al subir el archivo');
        });
    });
    describe('Manejo de errores en consultas', () => {
        it('debe manejar el error al avanzar el estatus', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.avanzarEstatus(10, {
                    idEstatus: 2,
                    idUsuario: 1,
                } as any)
            ).rejects.toThrow('Error al actualizar estatus');
        });

        it('debe manejar el error al crear una solicitud de compra', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.crearSolicitudCompra({ idOrden: 10, items: [] })
            ).rejects.toThrow('Error creando solicitud de compra');
        });

        it('debe manejar el error al consultar el historial', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getHistorial(10)
            ).rejects.toThrow('Error al obtener historial');
        });

        it('debe manejar el error al consultar las razones de cancelación', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getRazonesCancelacion()
            ).rejects.toThrow('Error al obtener razones de cancelación');
        });

        it('debe manejar el error al consultar una orden por ID', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getOrdenById(10)
            ).rejects.toThrow('Error obteniendo orden');
        });

        it('debe manejar el error al consultar los estatus de operaciones', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getEstatusOperaciones()
            ).rejects.toThrow('Error cargando catálogo de estatus');
        });

        it('debe manejar el error al consultar órdenes activas', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getOrdenesActivas()
            ).rejects.toThrow('Error al obtener órdenes activas');
        });

        it('debe manejar el error al consultar cotizaciones y canceladas', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getCotizacionesYCanceladas()
            ).rejects.toThrow('Error al obtener cotizaciones');
        });

        it('debe manejar el error al consultar órdenes por diseñador', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getOrdenesPorDisenador(5)
            ).rejects.toThrow('Error al obtener órdenes del diseñador');
        });

        it('debe manejar el error al consultar la lista general de órdenes', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as Response);

            await expect(
                OrderService.getOrdenes()
            ).rejects.toThrow('Error al obtener lista de órdenes');
        });
    });
},)