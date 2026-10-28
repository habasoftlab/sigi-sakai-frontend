
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesignerListPage from './page';

import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';

const mockPush = jest.fn();
const mockShowToast = jest.fn();

const mockRouter = {
    push: mockPush,
};

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getOrdenesPorDisenador: jest.fn(),
        getEstatusOperaciones: jest.fn(),
    },
}));

jest.mock('@/app/service/clientService', () => ({
    ClientService: {
        getAll: jest.fn(),
    },
}));

jest.mock('primereact/toast', () => {
    const React = require('react');

    return {
        Toast: React.forwardRef(function MockToast(_props: any, ref: any) {
            React.useImperativeHandle(ref, () => ({
                show: (...args: any[]) => mockShowToast(...args),
            }));

            return <div data-testid="toast" />;
        }),
    };
});

jest.mock('primereact/card', () => ({
    Card: ({ children }: any) => <section>{children}</section>,
}));

jest.mock('primereact/tag', () => ({
    Tag: ({ value, severity, icon }: any) => (
        <span data-severity={severity} data-icon={icon}>
            {value}
        </span>
    ),
}));

jest.mock('primereact/button', () => ({
    Button: ({
        onClick,
        icon,
        tooltip,
        tooltipOptions,
        severity,
        rounded,
        text,
        label,
        className,
        ...props
    }: any) => (
        <button
            type="button"
            onClick={onClick}
            aria-label={tooltip || icon || label || 'Acción'}
            className={className}
            data-severity={severity}
            data-rounded={rounded ? 'true' : undefined}
            data-text={text ? 'true' : undefined}
            {...props}
        >
            {label}
            {icon && <span>{icon}</span>}
        </button>
    ),
}));

jest.mock('primereact/datatable', () => ({
    DataTable: ({ value, children, emptyMessage, loading }: any) => {
        const columns = React.Children.toArray(children) as React.ReactElement[];

        return (
            <div data-testid="datatable" data-loading={String(loading)}>
                {value.length === 0 ? (
                    emptyMessage
                ) : (
                    value.map((row: any, index: number) => (
                        <div key={row.idOrden ?? index} data-testid="order-row">
                            {columns.map((column, columnIndex) => {
                                const body = column.props.body;
                                const field = column.props.field;

                                return (
                                    <span key={columnIndex}>
                                        {body
                                            ? body(row)
                                            : field
                                                ? row[field]
                                                : null}
                                    </span>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        );
    },
}));

jest.mock('primereact/column', () => ({
    Column: () => null,
}));

const mockOrders = [
    {
        idOrden: 15,
        idCliente: 3,
        idEstatusActual: 7,
        fechaEntregaFormal: '2026-11-01T12:00:00',
        fechaCreacion: '2026-10-20T12:00:00',
        montoTotal: 1500,
    },
];

const mockClients = [
    { id: 3, nombre: 'Cliente de prueba' },
];

const mockStatuses = [
    { idEstatus: 7, descripcion: 'En Desarrollo' },
    { idEstatus: 10, descripcion: 'Rechazado' },
    { idEstatus: 3, descripcion: 'Pendiente de diseño' },
];

const createOrder = (
    idOrden: number,
    idEstatusActual: number,
    fecha: string,
    extra: Record<string, any> = {}
) => ({
    idOrden,
    idCliente: 3,
    idEstatusActual,
    fechaEntregaFormal: fecha,
    fechaCreacion: fecha,
    montoTotal: 1000,
    ...extra,
});

describe('DesignerListPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        localStorage.setItem(
            'user',
            JSON.stringify({
                idUsuario: 1,
                nombre: 'Diseñador de prueba',
            })
        );

        (ClientService.getAll as jest.Mock).mockResolvedValue([...mockClients]);

        (OrderService.getEstatusOperaciones as jest.Mock).mockResolvedValue([
            ...mockStatuses,
        ]);

        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [...mockOrders],
        });
    });

    afterEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('debe renderizar el saludo con el nombre del diseñador', async () => {
        render(<DesignerListPage />);

        expect(
            await screen.findByText('Hola, Diseñador de prueba!')
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Recuerda enviar tus diseños listos a la brevedad/)
        ).toBeInTheDocument();
    });

    it('debe redirigir al login si no existe una sesión', async () => {
        localStorage.removeItem('user');

        render(<DesignerListPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/auth/login');
        });

        expect(OrderService.getOrdenesPorDisenador).not.toHaveBeenCalled();
    });

    it('debe cargar los catálogos de clientes y estatus', async () => {
        render(<DesignerListPage />);

        await screen.findByText('Cliente de prueba');

        expect(ClientService.getAll).toHaveBeenCalledTimes(1);
        expect(OrderService.getEstatusOperaciones).toHaveBeenCalledTimes(1);
    });

    it('debe consultar las órdenes usando el identificador del usuario', async () => {
        render(<DesignerListPage />);

        await waitFor(() => {
            expect(OrderService.getOrdenesPorDisenador).toHaveBeenCalledWith(
                1,
                0,
                1000
            );
        });
    });

    it('debe admitir el campo id como identificador de usuario', async () => {
        localStorage.setItem(
            'user',
            JSON.stringify({
                id: 22,
                nombre: 'Diseñador alternativo',
            })
        );

        render(<DesignerListPage />);

        await waitFor(() => {
            expect(OrderService.getOrdenesPorDisenador).toHaveBeenCalledWith(
                22,
                0,
                1000
            );
        });
    });

    it('debe mostrar la cantidad de órdenes cargadas', async () => {
        render(<DesignerListPage />);

        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument();
        });

        expect(screen.getByTestId('order-row')).toBeInTheDocument();
    });

    it('debe priorizar las órdenes rechazadas y ordenar por fecha ascendente', async () => {
        const orders = [
            createOrder(1, 7, '2026-11-10T12:00:00'),
            createOrder(2, 10, '2026-11-05T12:00:00'),
            createOrder(3, 10, '2026-11-01T12:00:00'),
            createOrder(4, 7, '2026-11-02T12:00:00'),
        ];

        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: orders,
        });

        render(<DesignerListPage />);

        await waitFor(() => {
            expect(screen.getAllByTestId('order-row')).toHaveLength(4);
        });

        const rows = screen.getAllByTestId('order-row');

        expect(rows[0]).toHaveTextContent('3');
        expect(rows[1]).toHaveTextContent('2');
        expect(rows[2]).toHaveTextContent('4');
        expect(rows[3]).toHaveTextContent('1');
    });

    it('debe aceptar una respuesta de órdenes en forma de arreglo', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue([
            createOrder(25, 7, '2026-11-01T12:00:00'),
        ]);

        render(<DesignerListPage />);

        await waitFor(() => {
            expect(screen.getByTestId('order-row')).toHaveTextContent('25');
        });
    });

    it('debe mostrar el nombre del cliente incluido en la orden', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [
                createOrder(15, 7, '2026-11-01T12:00:00', {
                    clienteNombre: 'Cliente desde la orden',
                }),
            ],
        });

        render(<DesignerListPage />);

        expect(
            await screen.findByText('Cliente desde la orden')
        ).toBeInTheDocument();
    });

    it('debe obtener el nombre del cliente desde el catálogo', async () => {
        render(<DesignerListPage />);

        expect(
            await screen.findByText('Cliente de prueba')
        ).toBeInTheDocument();
    });

    it('debe mostrar un nombre alternativo si el cliente no está en el catálogo', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [
                createOrder(15, 7, '2026-11-01T12:00:00', {
                    idCliente: 99,
                }),
            ],
        });

        render(<DesignerListPage />);

        expect(await screen.findByText('Cliente #99')).toBeInTheDocument();
    });

    it('debe mostrar la descripción del estatus desde el catálogo', async () => {
        render(<DesignerListPage />);

        expect(await screen.findByText('En Desarrollo')).toBeInTheDocument();
    });

    it('debe asignar la severidad de error a las órdenes rechazadas', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [
                createOrder(30, 10, '2026-11-01T12:00:00'),
            ],
        });

        render(<DesignerListPage />);

        const tag = await screen.findByText('Rechazado');

        expect(tag).toHaveAttribute('data-severity', 'danger');
        expect(tag).toHaveAttribute(
            'data-icon',
            'pi pi-exclamation-triangle'
        );
    });

    it('debe usar un estatus alternativo si no existe en el catálogo', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [
                createOrder(31, 99, '2026-11-01T12:00:00'),
            ],
        });

        render(<DesignerListPage />);

        expect(await screen.findByText('Estatus 99')).toBeInTheDocument();
    });

    it('debe mostrar el importe en pesos mexicanos', async () => {
        render(<DesignerListPage />);

        expect(
            await screen.findByText('$1,500.00')
        ).toBeInTheDocument();
    });

    it('debe mostrar N/A cuando una orden no tiene fecha', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [
                createOrder(40, 7, '', {
                    fechaEntregaFormal: null,
                    fechaCreacion: null,
                }),
            ],
        });

        render(<DesignerListPage />);

        expect(await screen.findByText('N/A')).toBeInTheDocument();
    });

    it('debe navegar al detalle al pulsar la acción de una orden', async () => {
        render(<DesignerListPage />);

        const actionButton = await screen.findByRole('button', {
            name: 'Trabajar orden',
        });

        fireEvent.click(actionButton);

        expect(mockPush).toHaveBeenCalledWith('/designerdetail?id=15');
    });

    it('debe usar una acción de corrección para las órdenes rechazadas', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [
                createOrder(45, 10, '2026-11-01T12:00:00'),
            ],
        });

        render(<DesignerListPage />);

        const actionButton = await screen.findByRole('button', {
            name: 'Corregir diseño',
        });

        fireEvent.click(actionButton);

        expect(mockPush).toHaveBeenCalledWith('/designerdetail?id=45');
    });

    it('debe mostrar un mensaje cuando no hay órdenes pendientes', async () => {
        (OrderService.getOrdenesPorDisenador as jest.Mock).mockResolvedValue({
            content: [],
        });

        render(<DesignerListPage />);

        expect(
            await screen.findByText(
                '¡Todo limpio! No tienes órdenes pendientes por ahora.'
            )
        ).toBeInTheDocument();
    });

    it('debe mostrar una notificación si falla la carga de órdenes', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenesPorDisenador as jest.Mock).mockRejectedValue(
            new Error('Error de conexión')
        );

        render(<DesignerListPage />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar tus órdenes.',
                })
            );
        });

        consoleError.mockRestore();
    });

    it('debe manejar errores al cargar los catálogos', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (ClientService.getAll as jest.Mock).mockRejectedValue(
            new Error('Error al cargar clientes')
        );

        render(<DesignerListPage />);

        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(
                'Error cargando catálogos',
                expect.any(Error)
            );
        });

        consoleError.mockRestore();
    });
});
