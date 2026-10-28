import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from './useNotifications';
import { notificationService, Notificacion } from '@/app/service/notificationService';
import { notificationSocket } from '@/app/service/notificationSocket';

jest.mock('@/app/service/notificationService');
jest.mock('@/app/service/notificationSocket');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockNotificationSocket = notificationSocket as jest.Mocked<typeof notificationSocket>;

describe('useNotifications Hook', () => {
    const mockUserId = 'user-123';
    const mockPendientes: Notificacion[] = [
        {
            id: 1,
            emisorId: 'user-2',
            receptorId: mockUserId,
            categoria: 'SOLICITUD_INSUMOS',
            titulo: 'Requerimiento',
            mensaje: 'Mensaje de prueba',
            leida: false,
            creadaEn: '2026-10-18T10:00:00Z',
            leidaEn: null,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockNotificationService.getPendientes.mockResolvedValue(mockPendientes);
    });

    it('no debe realizar llamadas a servicios ni conectar socket si userId es null', () => {
        const { result } = renderHook(() => useNotifications(null));

        expect(result.current.notifications).toEqual([]);
        expect(result.current.unreadCount).toBe(0);
        expect(result.current.loading).toBe(false);
        expect(mockNotificationService.getPendientes).not.toHaveBeenCalled();
        expect(mockNotificationSocket.connect).not.toHaveBeenCalled();
    });

    it('debe cargar notificaciones pendientes e inicializar WebSocket cuando userId existe', async () => {
        const { result } = renderHook(() => useNotifications(mockUserId));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockNotificationService.getPendientes).toHaveBeenCalled();
        expect(result.current.notifications).toEqual(mockPendientes);
        expect(result.current.unreadCount).toBe(1);
        expect(mockNotificationSocket.connect).toHaveBeenCalledWith(
            mockUserId,
            expect.any(Function)
        );
    });

    it('debe manejar errores al cargar notificaciones pendientes', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockNotificationService.getPendientes.mockRejectedValueOnce(new Error('Fetch error'));

        const { result } = renderHook(() => useNotifications(mockUserId));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.notifications).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith(
            'Error al cargar notificaciones pendientes:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('debe procesar notificaciones entrantes vía WebSocket y ejecutar onNewNotification', async () => {
        let socketCallback: (notif: any) => void = () => {};
        mockNotificationSocket.connect.mockImplementation((_, callback) => {
            socketCallback = callback;
        });

        const onNewNotifMock = jest.fn();

        const { result } = renderHook(() => useNotifications(mockUserId, onNewNotifMock));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const rawSocketNotif = {
            id: 10,
            titulo: 'Nueva Orden',
            mensaje: 'Se creó la orden #100',
            categoria: 'ORDEN_IMPRESION',
        };

        act(() => {
            socketCallback(rawSocketNotif);
        });

        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.notifications[0].titulo).toBe('Nueva Orden');
        expect(result.current.unreadCount).toBe(2);
        expect(onNewNotifMock).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
    });

    it('debe marcar una notificación como leída y llamar al servicio', async () => {
        mockNotificationService.marcarComoLeida.mockResolvedValueOnce();

        const { result } = renderHook(() => useNotifications(mockUserId));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.markAsRead(1);
        });

        expect(result.current.notifications).toEqual([]);
        expect(result.current.unreadCount).toBe(0);
        expect(mockNotificationService.marcarComoLeida).toHaveBeenCalledWith(1);
    });

    it('omitir la llamada al servidor si el ID es temporal (mayor a 1000000000000)', async () => {
        const tempId = 17000000000000;

        const { result } = renderHook(() => useNotifications(mockUserId));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.markAsRead(tempId);
        });

        expect(mockNotificationService.marcarComoLeida).not.toHaveBeenCalled();
    });

    it('debe desconectar el socket al desmontar el componente', async () => {
        const { unmount } = renderHook(() => useNotifications(mockUserId));

        unmount();

        expect(mockNotificationSocket.disconnect).toHaveBeenCalled();
    });
});