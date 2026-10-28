import { NotificationSocketService, notificationSocket } from './notificationSocket';

class MockWebSocket {
    static instances: MockWebSocket[] = [];
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    send = jest.fn();
    close = jest.fn(() => {
        if (this.onclose) this.onclose();
    });

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }
}

describe('NotificationSocketService', () => {
    let service: NotificationSocketService;
    const originalWebSocket = global.WebSocket;
    const originalNotification = global.Notification;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        MockWebSocket.instances = [];

        process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8080/ws';
        global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

        // Mock de API Notification de navegador
        global.Notification = jest.fn().mockImplementation(() => ({
            onclick: null
        })) as unknown as typeof Notification;
        Object.defineProperty(global.Notification, 'permission', {
            value: 'granted',
            writable: true
        });

        service = new NotificationSocketService();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    afterAll(() => {
        global.WebSocket = originalWebSocket;
        global.Notification = originalNotification;
    });

    describe('Inicialización y Conexión', () => {
        it('debe crear una instancia WebSocket y enviar INIT_SESSION al abrir la conexión', () => {
            const callback = jest.fn();
            service.connect('user-123', callback);

            const socket = MockWebSocket.instances[0];
            expect(socket).toBeDefined();
            expect(socket.url).toBe('ws://localhost:8080/ws');

            // Simular evento de apertura
            socket.onopen!();

            expect(socket.send).toHaveBeenCalledWith(
                JSON.stringify({ type: 'INIT_SESSION', userId: 'user-123' })
            );
        });

        it('debe registrar error y no conectar si NEXT_PUBLIC_WS_URL no está definida', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            delete process.env.NEXT_PUBLIC_WS_URL;

            const localService = new NotificationSocketService();
            localService.connect('user-123', jest.fn());

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('La variable NEXT_PUBLIC_WS_URL no está definida')
            );

            consoleSpy.mockRestore();
        });

        describe('Procesamiento de Mensajes', () => {
            it('debe ignorar mensajes de control de socket (ACK, PONG, INIT_SESSION_SUCCESS)', () => {
                const callback = jest.fn();
                service.connect('user-123', callback);
                const socket = MockWebSocket.instances[0];

                ['ACK', 'PONG', 'INIT_SESSION_SUCCESS'].forEach((type) => {
                    socket.onmessage!({ data: JSON.stringify({ type }) });
                });

                expect(callback).not.toHaveBeenCalled();
                expect(global.Notification).not.toHaveBeenCalled();
            });

            it('debe procesar notificaciones válidas, invocar el callback y disparar notificación nativa', () => {
                const callback = jest.fn();
                service.connect('user-123', callback);
                const socket = MockWebSocket.instances[0];

                const notifPayload = {
                    categoria: 'ORDEN_IMPRESION',
                    titulo: 'Orden Lista',
                    mensaje: 'La orden #105 está lista para impresión'
                };

                socket.onmessage!({ data: JSON.stringify(notifPayload) });

                expect(callback).toHaveBeenCalledWith(notifPayload);
                expect(global.Notification).toHaveBeenCalledWith(
                    'Orden Lista',
                    expect.objectContaining({
                        body: 'La orden #105 está lista para impresión',
                        silent: false
                    })
                );
            });

            it('debe manejar errores de parseo JSON sin romper el servicio', () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                service.connect('user-123', jest.fn());
                const socket = MockWebSocket.instances[0];

                socket.onmessage!({ data: 'invalid-json' });

                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error parseando notificación de WebSocket:',
                    expect.any(Error)
                );

                consoleSpy.mockRestore();
            });
        });

        describe('Reconexión y Desconexión', () => {
            it('debe intentar reconectarse aplicando exponential backoff al cerrarse el socket', () => {
                service.connect('user-123', jest.fn());
                const initialSocket = MockWebSocket.instances[0];

                // Cierre del primer socket
                initialSocket.onclose!();

                // Avance del tiempo para primer intento (delay base: 1000ms)
                jest.advanceTimersByTime(1000);

                expect(MockWebSocket.instances).toHaveLength(2);
            });

            it('debe cerrar la conexión limpiando listeners y estado al invocar disconnect', () => {
                service.connect('user-123', jest.fn());
                const socket = MockWebSocket.instances[0];

                service.disconnect();

                expect(socket.onclose).toBeNull();
                expect(socket.onerror).toBeNull();
                expect(socket.close).toHaveBeenCalled();
            });
        });
    });
})