import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderTimelinePage from './page';
import { OrderService } from '@/app/service/orderService';

const mockPush = jest.fn();
const mockShowToast = jest.fn();
let mockOrderId: string | null = '42';

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush
    }),
    useSearchParams: () => ({
        get: (key: string) => (key === 'id' ? mockOrderId : null)
    })
}));

jest.mock('primereact/toast', () => {
    const React = jest.requireActual('react');

    return {
        Toast: React.forwardRef((_props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                show: mockShowToast
            }));

            return null;
        })
    };
});

jest.mock('primereact/button', () => ({
    Button: ({
        label,
        icon,
        onClick,
        text,
        severity,
        rounded,
        outlined,
        loading,
        disabled,
        ...props
    }: any) => (
        <button
            type="button"
            aria-label={label || icon || 'Botón'}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {icon && <i className={icon} />}
            {label}
        </button>
    )
}));

jest.mock('primereact/card', () => ({
    Card: ({ title, subTitle, children }: any) => (
        <article>
            <h3>{title}</h3>
            {subTitle && <p>{subTitle}</p>}
            {children}
        </article>
    )
}));

jest.mock('primereact/timeline', () => ({
    Timeline: ({ value = [], marker, content }: any) => (
        <div data-testid="timeline">
            {value.map((item: any, index: number) => (
                <div data-testid="timeline-event" key={index}>
                    <div>{marker(item)}</div>
                    <div>{content(item)}</div>
                </div>
            ))}
        </div>
    )
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getHistorial: jest.fn()
    }
}));

const mockHistory = [
    {
        fecha: '2026-01-10 10:00',
        estatus: 'Cotización iniciada',
        usuario: 'Ana',
        claveEstatus: 'COT_INICIADA'
    },
    {
        fecha: '2026-01-11 11:30',
        estatus: 'Diseño en proceso',
        usuario: 'Luis',
        claveEstatus: 'DIS_EN_PROCESO'
    },
    {
        fecha: '2026-01-12 14:00',
        estatus: 'Orden en impresión',
        usuario: '',
        claveEstatus: 'ORD_EN_IMPRESION'
    },
    {
        fecha: '2026-01-13 16:00',
        estatus: 'Orden entregada',
        usuario: 'Ana',
        claveEstatus: 'ORD_ENTREGADA'
    },
    {
        fecha: '2026-01-14 09:00',
        estatus: 'Estatus desconocido',
        usuario: '',
        claveEstatus: 'ESTATUS_NO_RECONOCIDO'
    }
];

const renderPage = () => render(<OrderTimelinePage />);

const renderWithHistory = async (history: any[] = mockHistory) => {
    let resolveHistory!: (value: any[]) => void;

    const historyPromise = new Promise<any[]>((resolve) => {
        resolveHistory = resolve;
    });

    (OrderService.getHistorial as jest.Mock).mockReturnValue(historyPromise);

    await act(async () => {
        renderPage();
        await Promise.resolve();
        resolveHistory(history);
        await historyPromise;
    });
};

const renderWithHistoryError = async () => {
    let rejectHistory!: (reason: Error) => void;

    const historyPromise = new Promise<any[]>((_resolve, reject) => {
        rejectHistory = reject;
    });

    (OrderService.getHistorial as jest.Mock).mockReturnValue(historyPromise);

    await act(async () => {
        renderPage();

        await Promise.resolve();

        rejectHistory(new Error('Error al consultar historial'));
        await historyPromise.catch(() => undefined);
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    mockOrderId = '42';
    localStorage.clear();

    (OrderService.getHistorial as jest.Mock).mockResolvedValue(mockHistory);
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('OrderTimelinePage', () => {
    describe('Carga del historial', () => {
        it('muestra el título y el identificador de la orden', async () => {
            await renderWithHistory();

            expect(screen.getByText('Seguimiento de Orden')).toBeInTheDocument();
            expect(
                screen.getByText('Historial de movimientos para la orden #42')
            ).toBeInTheDocument();
            expect(screen.getByText('Cotización iniciada')).toBeInTheDocument();
        });

        it('consulta el historial con el id de la URL', async () => {
            await renderWithHistory();

            expect(OrderService.getHistorial).toHaveBeenCalledWith(42);
        });

        it('muestra los eventos del historial', async () => {
            await renderWithHistory();

            expect(screen.getByText('Cotización iniciada')).toBeInTheDocument();
            expect(screen.getByText('Diseño en proceso')).toBeInTheDocument();
            expect(screen.getByText('Orden en impresión')).toBeInTheDocument();
            expect(screen.getByText('Orden entregada')).toBeInTheDocument();
        });

        it('muestra el usuario que atendió el movimiento cuando existe', async () => {
            await renderWithHistory();

            expect(screen.getAllByText('Atendió:')).toHaveLength(3);
            expect(screen.getAllByText('Ana')).toHaveLength(2);
            expect(screen.getByText('Luis')).toBeInTheDocument();
        });

        it('no muestra el usuario cuando el historial no lo incluye', async () => {
            await renderWithHistory();

            const events = screen.getAllByTestId('timeline-event');
            const printingEvent = events.find((event) =>
                event.textContent?.includes('Orden en impresión')
            );

            expect(printingEvent).toBeDefined();
            expect(printingEvent).not.toHaveTextContent('Atendió:');
        });

        it('aplica el icono y color correspondientes a los estatus', async () => {
            await renderWithHistory();

            const markers = screen.getAllByTestId('timeline-event');

            expect(markers[0].querySelector('i')).toHaveClass('pi pi-file');
            expect(markers[0].querySelector('span')).toHaveStyle({
                backgroundColor: 'rgb(255, 193, 7)'
            });

            expect(markers[1].querySelector('i')).toHaveClass('pi pi-file-edit');
            expect(markers[2].querySelector('i')).toHaveClass('pi pi-print');
            expect(markers[3].querySelector('i')).toHaveClass('pi pi-check-circle');
            expect(markers[4].querySelector('i')).toHaveClass('pi pi-cog');
        });
    });

    describe('Botón regresar', () => {
        it('redirige a la página principal para un administrador', async () => {
            localStorage.setItem('user', JSON.stringify({ rol: 'admin' }));

            await renderWithHistory();

            fireEvent.click(screen.getByRole('button', { name: /regresar/i }));

            expect(mockPush).toHaveBeenCalledWith('/');
        });

        it('redirige a la página principal para contadora', async () => {
            localStorage.setItem('user', JSON.stringify({ rol: 'Contadora' }));

            await renderWithHistory();

            fireEvent.click(screen.getByRole('button', { name: /regresar/i }));

            expect(mockPush).toHaveBeenCalledWith('/');
        });

        it('redirige a la lista de órdenes para un rol no directivo', async () => {
            localStorage.setItem('user', JSON.stringify({ rol: 'Diseñador' }));

            await renderWithHistory();

            fireEvent.click(screen.getByRole('button', { name: /regresar/i }));

            expect(mockPush).toHaveBeenCalledWith('/listorder');
        });

        it('redirige a la página principal si no existe usuario en localStorage', async () => {
            await renderWithHistory();

            fireEvent.click(screen.getByRole('button', { name: /regresar/i }));

            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    describe('Estado vacío y errores', () => {
        it('muestra el mensaje cuando el historial está vacío', async () => {
            await renderWithHistory([]);

            expect(
                screen.getByText('No hay historial registrado para esta orden.')
            ).toBeInTheDocument();
        });

        it('muestra un toast cuando falla la carga del historial', async () => {
            await renderWithHistoryError();

            expect(OrderService.getHistorial).toHaveBeenCalledWith(42);
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el historial'
                })
            );
        });

        it('no consulta el servicio si la URL no contiene id', () => {
            mockOrderId = null;

            renderPage();

            expect(
                screen.getByText('Historial de movimientos para la orden #...')
            ).toBeInTheDocument();
            expect(OrderService.getHistorial).not.toHaveBeenCalled();
        });
    });
});