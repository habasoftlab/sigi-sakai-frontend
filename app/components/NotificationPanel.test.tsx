import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPanel } from './NotificationPanel';
import { Notificacion } from '@/app/service/notificationService';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

describe('NotificationPanel Component', () => {
    const mockOnMarkAsRead = jest.fn();
    const mockOnCloseOverlay = jest.fn();

    const mockNotifications: Notificacion[] = [
        {
            id: 1,
            emisorId: 'user-1',
            receptorId: 'user-2',
            categoria: 'SOLICITUD_INSUMOS',
            titulo: 'Solicitud de Insumos #50',
            mensaje: 'Se requieren materiales para la orden #50',
            leida: false,
            creadaEn: '2026-10-18T10:00:00Z',
            leidaEn: null,
        },
        {
            id: 2,
            emisorId: 'user-1',
            receptorId: 'user-2',
            categoria: 'COTIZACION_PAGADA',
            titulo: 'Cotización Pagada',
            mensaje: 'Se registró el pago de la cotización',
            leida: false,
            creadaEn: '2026-10-18T11:00:00Z',
            leidaEn: null,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe mostrar el estado de carga cuando loading es true', () => {
        render(
            <NotificationPanel
                notifications={[]}
                unreadCount={0}
                loading={true}
                onMarkAsRead={mockOnMarkAsRead}
                onCloseOverlay={mockOnCloseOverlay}
            />
        );

        const spinner = document.querySelector('.pi-spinner');
        expect(spinner).toBeInTheDocument();
    });

    it('debe mostrar el mensaje "Estás al día" cuando no hay notificaciones', () => {
        render(
            <NotificationPanel
                notifications={[]}
                unreadCount={0}
                loading={false}
                onMarkAsRead={mockOnMarkAsRead}
                onCloseOverlay={mockOnCloseOverlay}
            />
        );

        expect(screen.getByText('Estás al día')).toBeInTheDocument();
        expect(screen.getByText('0 nuevas')).toBeInTheDocument();
    });

    it('debe renderizar la lista de notificaciones y la cantidad de no leídas', () => {
        render(
            <NotificationPanel
                notifications={mockNotifications}
                unreadCount={2}
                loading={false}
                onMarkAsRead={mockOnMarkAsRead}
                onCloseOverlay={mockOnCloseOverlay}
            />
        );

        expect(screen.getByText('2 nuevas')).toBeInTheDocument();
        expect(screen.getByText('Solicitud de Insumos #50')).toBeInTheDocument();
        expect(screen.getByText('Cotización Pagada')).toBeInTheDocument();
    });

    it('debe redirigir a /receipt?id=50 y marcar como leída al hacer clic en una SOLICITUD_INSUMOS', () => {
        render(
            <NotificationPanel
                notifications={mockNotifications}
                unreadCount={2}
                loading={false}
                onMarkAsRead={mockOnMarkAsRead}
                onCloseOverlay={mockOnCloseOverlay}
            />
        );

        const notifItem = screen.getByText('Solicitud de Insumos #50');
        fireEvent.click(notifItem);

        expect(mockOnCloseOverlay).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/receipt?id=50');
        expect(mockOnMarkAsRead).toHaveBeenCalledWith(1);
    });

    it('no debe redirigir si la notificación no es SOLICITUD_INSUMOS pero sí marcar como leída y cerrar el panel', () => {
        render(
            <NotificationPanel
                notifications={mockNotifications}
                unreadCount={2}
                loading={false}
                onMarkAsRead={mockOnMarkAsRead}
                onCloseOverlay={mockOnCloseOverlay}
            />
        );

        const notifItem = screen.getByText('Cotización Pagada');
        fireEvent.click(notifItem);

        expect(mockOnCloseOverlay).toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockOnMarkAsRead).toHaveBeenCalledWith(2);
    });

    it('debe marcar como leída directamente mediante el botón de verificación sin disparar la redirección', () => {
        render(
            <NotificationPanel
                notifications={mockNotifications}
                unreadCount={2}
                loading={false}
                onMarkAsRead={mockOnMarkAsRead}
                onCloseOverlay={mockOnCloseOverlay}
            />
        );

        const checkButtons = screen.getAllByRole('button');
        fireEvent.click(checkButtons[0]);

        expect(mockOnMarkAsRead).toHaveBeenCalledWith(1);
        expect(mockPush).not.toHaveBeenCalled();
    });
});