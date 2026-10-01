export class NotificationSocketService {
    private socket: WebSocket | null = null;
    private userId: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 7;
    private baseDelay = 1000;
    private onMessageCallback: ((notif: any) => void) | null = null;

    private readonly wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    connect(userId: string, callback: (notif: any) => void) {
        this.userId = userId;
        this.onMessageCallback = callback;
        this.initializeSocket();
    }

    private initializeSocket() {
        if (!this.userId) return;

        if (!this.wsUrl || this.wsUrl === 'undefined') {
            console.error('ERROR CRÍTICO: La variable NEXT_PUBLIC_WS_URL no está definida en el entorno.');
            return;
        }

        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket conectado correctamente');
            this.reconnectAttempts = 0;
            this.socket?.send(JSON.stringify({ type: 'INIT_SESSION', userId: this.userId }));
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Ignorar mensajes de control del socket
                if (data.type === 'ACK' || data.type === 'PONG' || data.type === 'INIT_SESSION_SUCCESS') {
                    return;
                }

                if (data.categoria || data.titulo || data.contenido) {
                    this.triggerNativeNotification(data);
                    if (this.onMessageCallback) this.onMessageCallback(data);
                }
            } catch (error) {
                console.error("Error parseando notificación de WebSocket:", error);
            }
        };

        this.socket.onclose = () => this.handleReconnect();
        this.socket.onerror = () => this.socket?.close();
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Máximos intentos de reconexión alcanzados.');
            return;
        }

        const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;

        setTimeout(() => {
            if (this.userId) {
                this.initializeSocket();
            }
        }, delay);
    }

    private triggerNativeNotification(data: any) {
        const titulo =
            data.titulo ||
            data.contenido?.titulo ||
            'Nueva Notificación';

        const mensaje =
            data.mensaje ||
            data.contenido?.mensaje ||
            data.body ||
            'Has recibido un nuevo aviso en el sistema.';

        if (!data.titulo && !data.contenido && !data.mensaje) {
            console.warn('Payload de WebSocket sin contenido visible ignorado:', data);
            return;
        }

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(titulo, {
                body: mensaje,
                silent: false
            });

            notification.onclick = () => {
                window.focus();
            };
        }
    }

    disconnect() {
        this.userId = null;
        if (this.socket) {
            this.socket.onclose = null;
            this.socket.onerror = null;
            this.socket.close();
            this.socket = null;
        }
    }
}

export const notificationSocket = new NotificationSocketService();