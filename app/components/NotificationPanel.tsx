import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Notificacion, CategoriaNotificacion } from '@/app/service/notificationService';

interface NotificationPanelProps {
    notifications: Notificacion[];
    unreadCount: number;
    loading?: boolean;
    onMarkAsRead: (id: number | string) => void;
    onCloseOverlay?: () => void;
}

const getNotificationConfig = (categoria: CategoriaNotificacion) => {
    switch (categoria) {
        case 'COTIZACION_PAGADA':
            return { icon: 'pi pi-dollar', color: 'text-green-500 bg-green-50' };
        case 'SOLICITUD_INSUMOS':
            return { icon: 'pi pi-box', color: 'text-blue-500 bg-blue-50' };
        case 'ORDEN_IMPRESION':
            return { icon: 'pi pi-print', color: 'text-purple-500 bg-purple-50' };
        case 'ORDEN_LISTA_ENTREGA':
            return { icon: 'pi pi-send', color: 'text-teal-500 bg-teal-50' };
        case 'ORDEN_CANCELADA':
            return { icon: 'pi pi-exclamation-triangle', color: 'text-red-500 bg-red-50' };
        default:
            return { icon: 'pi pi-bell', color: 'text-primary bg-primary-50' };
    }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
    notifications,
    unreadCount,
    loading = false,
    onMarkAsRead,
    onCloseOverlay
}) => {
    const router = useRouter();

    const extractOrderId = (n: Notificacion): string | null => {
        const notifAny = n as any;

        // 1. Revisar propiedades directas
        if (notifAny.idOrden) return String(notifAny.idOrden);
        if (notifAny.ordenId) return String(notifAny.ordenId);
        if (notifAny.referenciaId) return String(notifAny.referenciaId);

        // 2. Revisar dentro del objeto anidado 'contenido'
        if (notifAny.contenido?.idOrden) return String(notifAny.contenido.idOrden);
        if (notifAny.contenido?.ordenId) return String(notifAny.contenido.ordenId);

        // 3. Búsqueda por Expresión Regular (#12 u orden 12) en título o mensaje
        const textToSearch = `${n.titulo || ''} ${n.mensaje || ''} ${notifAny.contenido?.mensaje || ''}`;

        const hashMatch = textToSearch.match(/#(\d+)/);
        if (hashMatch) return hashMatch[1];

        const numberMatch = textToSearch.match(/(?:orden|solicitud|id)\s*#?:\s*(\d+)/i) || textToSearch.match(/\b(\d+)\b/);
        if (numberMatch) return numberMatch[1];

        return null;
    };

const handleItemClick = (n: Notificacion) => {
        const orderId = extractOrderId(n);

        // 1. Cerrar el panel flotante
        if (onCloseOverlay) {
            onCloseOverlay();
        }

        // 2. Redirigir ÚNICAMENTE si es una Solicitud de Insumos
        if (n.categoria === 'SOLICITUD_INSUMOS' && orderId) {
            router.push(`/receipt?id=${orderId}`);
        }

        // 3. Marcar como leída sin importar la categoría
        onMarkAsRead(n.id);
    };

    const renderNotificationContent = () => {
        if (loading) {
            return (
                <div className="flex justify-content-center py-6">
                    <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                </div>
            );
        }

        if (notifications.length === 0) {
            return (
                <div className="p-4 text-center text-500 flex flex-column align-items-center gap-2">
                    <i className="pi pi-check-circle text-4xl text-green-500"></i>
                    <span className="font-medium text-900">Estás al día</span>
                </div>
            );
        }

        return notifications.map((n) => {
            const { icon, color } = getNotificationConfig(n.categoria);

            return (
                <div
                    key={n.id}
                    className="p-3 border-bottom-1 surface-border hover:surface-hover cursor-pointer transition-colors transition-duration-150 flex align-items-start gap-3 relative"
                    style={{ zIndex: 1, pointerEvents: 'auto' }}
                >
                    {/* ÁREA CLICKEABLE PRINCIPAL */}
                    <div
                        className="flex-1 flex align-items-start gap-3"
                        onClick={() => handleItemClick(n)}
                    >
                        <div className={`border-circle p-2 flex align-items-center justify-content-center flex-shrink-0 ${color}`}>
                            <i className={`${icon} text-lg`}></i>
                        </div>

                        <div className="flex-1 flex flex-column gap-1">
                            <span className="font-bold text-xs text-900 line-height-1">
                                {n.titulo}
                            </span>
                            <p className="m-0 text-xs text-600 line-height-2">
                                {n.mensaje}
                            </p>
                        </div>
                    </div>

                    {/* BOTÓN INDEPENDIENTE PARA MARCAR COMO LEÍDA */}
                    <Button
                        icon="pi pi-check"
                        className="p-button-rounded p-button-text p-button-success p-button-sm flex-shrink-0"
                        tooltip="Marcar como leída"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(n.id);
                        }}
                    />
                </div>
            );
        });
    };

    return (
        <div className="w-22rem p-0 select-none">
            <div className="p-3 font-bold border-bottom-1 surface-border bg-primary text-white flex justify-content-between align-items-center border-round-top">
                <span className="flex align-items-center gap-2">
                    <i className="pi pi-bell"></i> Notificaciones
                </span>
                <span className="text-xs bg-primary-reverse text-primary border-round px-2 py-1 font-semibold">
                    {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                </span>
            </div>
            {renderNotificationContent()}
        </div>
    );
};