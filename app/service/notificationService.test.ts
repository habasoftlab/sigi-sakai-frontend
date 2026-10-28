import { notificationService, Notificacion } from './notificationService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('notificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPendientes', () => {
        it('debe retornar la lista de notificaciones pendientes cuando la petición es exitosa', async () => {
            const mockNotificaciones: Notificacion[] = [
                {
                    id: 1,
                    emisorId: 'user-1',
                    receptorId: 'user-2',
                    categoria: 'SOLICITUD_INSUMOS',
                    titulo: 'Insumos requeridos',
                    mensaje: 'Se solicita papel fotográfico',
                    leida: false,
                    creadaEn: '2026-10-18T10:00:00Z',
                    leidaEn: null,
                },
            ];

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockNotificaciones),
            } as unknown as Response);

            const result = await notificationService.getPendientes();

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/notificaciones/pendientes'),
                expect.objectContaining({ method: 'GET' })
            );
            expect(result).toEqual(mockNotificaciones);
        });

        it('debe lanzar un error cuando falla la obtención de notificaciones pendientes', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);

            await expect(notificationService.getPendientes()).rejects.toThrow(
                'Error al obtener notificaciones pendientes'
            );
        });
    });

    describe('marcarComoLeida', () => {
        it('debe enviar una petición PATCH para marcar la notificación como leída', async () => {
            const idNotificacion = 10;

            mockApiClient.mockResolvedValueOnce({
                ok: true,
            } as unknown as Response);

            await notificationService.marcarComoLeida(idNotificacion);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/notificaciones/${idNotificacion}/leer`),
                expect.objectContaining({ method: 'PATCH' })
            );
        });

        it('debe soportar identificadores de notificación como string', async () => {
            const idNotificacion = 'notif-abc-123';

            mockApiClient.mockResolvedValueOnce({
                ok: true,
            } as unknown as Response);

            await notificationService.marcarComoLeida(idNotificacion);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/notificaciones/${idNotificacion}/leer`),
                expect.objectContaining({ method: 'PATCH' })
            );
        });

        it('debe lanzar un error cuando la petición para marcar como leída falla', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);

            await expect(notificationService.marcarComoLeida(99)).rejects.toThrow(
                'Error al marcar la notificación como leída'
            );
        });
    });
});