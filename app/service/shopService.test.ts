import { comprasService, SolicitudCompra } from './shopService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('comprasService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPendientes', () => {
        it('debe obtener la lista de solicitudes de compra pendientes cuando la petición es exitosa', async () => {
            const mockSolicitudes: SolicitudCompra[] = [
                {
                    idSolicitud: 1,
                    idOrden: 101,
                    idUsuarioSolicitante: 5,
                    idEstatus: 1,
                    fechaCreacion: '2026-10-18T10:00:00Z',
                    descripcionSolicitud: 'Requerimiento de tinta negra y vinil',
                    detalles: [
                        { idDetalle: 10, idProducto: 2, cantidad: 5 }
                    ]
                }
            ];

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockSolicitudes),
            } as unknown as Response);

            const result = await comprasService.getPendientes();

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/compras/pendientes'),
                expect.objectContaining({ method: 'GET' })
            );
            expect(result).toEqual(mockSolicitudes);
        });

        it('debe lanzar un error cuando la petición para obtener compras pendientes no es exitosa', async () => {
            mockApiClient.mockResolvedValueOnce({
                ok: false
            } as unknown as Response);

            await expect(comprasService.getPendientes()).rejects.toThrow(
                'Error al obtener compras pendientes'
            );
        });
    });
});