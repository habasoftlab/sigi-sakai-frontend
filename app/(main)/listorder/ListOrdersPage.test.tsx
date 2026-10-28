import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListOrderPage from './page';
import { OrderService } from '@/app/service/orderService';
import { UserService } from '@/app/service/userService';
import { ClientService } from '@/app/service/clientService';

const mockShowToast = jest.fn();

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: any) => {
        const React = jest.requireActual('react');
        if (
            React.isValidElement(children) &&
            children.type === 'a'
        ) {
            return React.cloneElement(children, { href } as any);
        }
        return <a href={href}>{children}</a>;
    }
}));

jest.mock('primereact/button', () => ({
    Button: ({
        label,
        icon,
        tooltip,
        onClick,
        disabled,
        loading,
        children,
        rounded,
        text,
        severity,
        ...props
    }: any) => (
        <button
            type="button"
            aria-label={label || tooltip || icon || 'Botón'}
            title={tooltip}
            onClick={onClick}
            disabled={disabled}
            data-loading={loading ? 'true' : 'false'}
            {...props}
        >
            {label || children || tooltip || icon}
        </button>
    )
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

jest.mock('primereact/tag', () => ({
    Tag: ({ value, icon }: any) => (
        <span data-testid="status-tag" data-icon={icon}>
            {value}
        </span>
    )
}));

jest.mock('primereact/column', () => ({
    Column: () => null
}));

jest.mock('primereact/dropdown', () => ({
    Dropdown: ({
        id,
        value,
        options = [],
        optionLabel = 'label',
        optionValue = 'value',
        onChange,
        placeholder,
        disabled
    }: any) => (
        <select
            id={id}
            value={value ?? ''}
            disabled={disabled}
            onChange={(event) => {
                const selected = options.find(
                    (option: any) =>
                        String(option[optionValue]) === event.target.value
                );

                onChange?.({
                    value: selected ? selected[optionValue] : null
                });
            }}
        >
            <option value="">{placeholder || 'Seleccionar'}</option>
            {options.map((option: any) => (
                <option
                    key={option[optionValue]}
                    value={option[optionValue]}
                >
                    {option[optionLabel]}
                </option>
            ))}
        </select>
    )
}));

jest.mock('primereact/dialog', () => ({
    Dialog: ({ visible, header, children, footer, onHide }: any) =>
        visible ? (
            <div role="dialog" aria-label="Diálogo">
                <div>{header}</div>
                <div>{children}</div>
                <div>{footer}</div>
                <button type="button" onClick={onHide}>
                    Cerrar diálogo
                </button>
            </div>
        ) : null
}));

jest.mock('primereact/treetable', () => ({
    TreeTable: ({
        value = [],
        children,
        loading,
        emptyMessage,
        onPage
    }: any) => {
        const React = jest.requireActual('react');
        const columns = React.Children.toArray(children) as any[];

        const renderNode = (node: any): any => (
            <React.Fragment key={node.key}>
                <tr>
                    {columns.map((column: any, index: number) => {
                        const props = column.props;
                        const content = props.body
                            ? props.body(node)
                            : node.data?.[props.field];

                        return <td key={index}>{content ?? ''}</td>;
                    })}
                </tr>
                {(node.children || []).map(renderNode)}
            </React.Fragment>
        );

        return (
            <div>
                {loading && <span role="status">Cargando órdenes</span>}
                <table>
                    <thead>
                        <tr>
                            {columns.map((column: any, index: number) => (
                                <th key={index}>{column.props.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {value.length > 0 ? (
                            value.map(renderNode)
                        ) : (
                            <tr>
                                <td>{emptyMessage}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <button
                    type="button"
                    onClick={() => onPage?.({ first: 10, rows: 10 })}
                >
                    Página siguiente
                </button>
                <button
                    type="button"
                    onClick={() => onPage?.({ first: 0, rows: 5 })}
                >
                    Mostrar cinco
                </button>
            </div>
        );
    }
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getOrdenesActivas: jest.fn(),
        getEstatusOperaciones: jest.fn(),
        getRazonesCancelacion: jest.fn(),
        cancelarOrden: jest.fn(),
        avanzarEstatus: jest.fn()
    }
}));

jest.mock('@/app/service/userService', () => ({
    UserService: {
        getDesigners: jest.fn()
    }
}));

jest.mock('@/app/service/clientService', () => ({
    ClientService: {
        getAll: jest.fn()
    }
}));

const mockDesigners = [
    { idUsuario: 5, nombre: 'Ana Diseñadora' },
    { idUsuario: 6, nombre: 'Luis Diseñador' }
];

const mockClients = [
    { id: 10, nombre: 'Cliente Demo' },
    { id: 20, nombre: 'Cliente Empresa' }
];

const mockStatuses = [
    { idEstatus: 2, descripcion: 'En proceso' },
    { idEstatus: 6, descripcion: 'Lista para entrega' },
    { idEstatus: 11, descripcion: 'Cancelada' },
    { idEstatus: 12, descripcion: 'Entregada' }
];

const mockReasons = [
    { idRazon: 1, descripcion: 'Cancelación del cliente' },
    { idRazon: 2, descripcion: 'Error en la cotización' }
];

const mockOrders = [
    {
        idOrden: 101,
        idUsuarioDisenador: 5,
        idCliente: 10,
        idEstatusActual: 2,
        montoTotal: 300,
        montoPagado: 100,
        fechaCreacion: '2026-10-20T12:00:00'
    },
    {
        idOrden: 102,
        idUsuarioDisenador: 5,
        idCliente: 20,
        idEstatusActual: 6,
        montoTotal: 500,
        montoPagado: 500,
        fechaCreacion: '2026-10-21T12:00:00'
    },
    {
        idOrden: 103,
        idUsuarioDisenador: 6,
        idCliente: 10,
        idEstatusActual: 6,
        montoTotal: 800,
        montoPagado: 600,
        fechaCreacion: '2026-10-22T12:00:00'
    },
    {
        idOrden: 104,
        idUsuarioDisenador: null,
        idCliente: null,
        idEstatusActual: 12,
        montoTotal: 150,
        montoPagado: 150,
        fechaCreacion: '2026-10-22T15:00:00'
    }
];

const mockOrderResponse = () => ({
    content: mockOrders,
    page: { totalElements: 24 }
});

const configureServices = () => {
    (UserService.getDesigners as jest.Mock).mockResolvedValue(mockDesigners);
    (ClientService.getAll as jest.Mock).mockResolvedValue(mockClients);
    (OrderService.getEstatusOperaciones as jest.Mock).mockResolvedValue(mockStatuses);
    (OrderService.getRazonesCancelacion as jest.Mock).mockResolvedValue(mockReasons);
    (OrderService.getOrdenesActivas as jest.Mock).mockResolvedValue(mockOrderResponse());
    (OrderService.cancelarOrden as jest.Mock).mockResolvedValue(undefined);
    (OrderService.avanzarEstatus as jest.Mock).mockResolvedValue(undefined);
};

const renderPage = async () => {
    render(<ListOrderPage />);

    await screen.findByText('Orden #101');
};

describe('ListOrderPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem(
            'user',
            JSON.stringify({ idUsuario: 99 })
        );
        configureServices();
    });

    describe('Carga inicial', () => {
        it('muestra el título y la descripción de la página', async () => {
            await renderPage();

            expect(screen.getByText('Lista de ordenes')).toBeInTheDocument();
            expect(
                screen.getByText('Agrupadas por diseñador asignado')
            ).toBeInTheDocument();
        });

        it('carga los catálogos y las órdenes iniciales', async () => {
            await renderPage();

            expect(UserService.getDesigners).toHaveBeenCalledTimes(1);
            expect(ClientService.getAll).toHaveBeenCalledTimes(1);
            expect(OrderService.getEstatusOperaciones).toHaveBeenCalledTimes(1);
            expect(OrderService.getRazonesCancelacion).toHaveBeenCalledTimes(1);
            expect(OrderService.getOrdenesActivas).toHaveBeenCalledWith(0, 10);
        });

        it('muestra un mensaje cuando no hay órdenes activas', async () => {
            (OrderService.getOrdenesActivas as jest.Mock).mockResolvedValue({
                content: [],
                page: { totalElements: 0 }
            });

            render(<ListOrderPage />);

            expect(
                await screen.findByText('No hay órdenes activas.')
            ).toBeInTheDocument();
        });

        it('muestra una notificación si falla la carga de catálogos', async () => {
            const consoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            (UserService.getDesigners as jest.Mock).mockRejectedValue(
                new Error('Error de catálogo')
            );

            render(<ListOrderPage />);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        detail: 'Fallo al cargar catálogos'
                    })
                );
            });

            consoleError.mockRestore();
        });

        it('muestra una notificación si falla la carga de órdenes', async () => {
            const consoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            (OrderService.getOrdenesActivas as jest.Mock).mockRejectedValue(
                new Error('Error de órdenes')
            );

            render(<ListOrderPage />);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        detail: 'No se pudieron cargar las órdenes'
                    })
                );
            });

            consoleError.mockRestore();
        });
    });

    describe('Visualización de órdenes', () => {
        it('agrupa las órdenes por diseñador', async () => {
            await renderPage();

            expect(screen.getByText('Ana Diseñadora')).toBeInTheDocument();
            expect(screen.getByText('Luis Diseñador')).toBeInTheDocument();
            expect(screen.getByText('Sin Asignar / Mostrador')).toBeInTheDocument();
        });

        it('muestra los clientes asociados a las órdenes', async () => {
            await renderPage();

            expect(screen.getAllByText('Cliente Demo').length).toBeGreaterThan(0);
            expect(screen.getByText('Cliente Empresa')).toBeInTheDocument();
        });

        it('muestra las referencias y los estatus de las órdenes', async () => {
            await renderPage();

            expect(screen.getByText('Orden #101')).toBeInTheDocument();
            expect(screen.getByText('Orden #102')).toBeInTheDocument();
            expect(screen.getByText('En proceso')).toBeInTheDocument();
            expect(screen.getAllByText('Lista para entrega')).toHaveLength(2);
        });

        it('muestra el saldo pendiente de una orden', async () => {
            await renderPage();

            expect(
                screen.getAllByText('Resta: $200.00')
            ).toHaveLength(2);
        });

        it('muestra el total de órdenes por diseñador', async () => {
            await renderPage();

            expect(screen.getByText('2 órdenes')).toBeInTheDocument();
            expect(screen.getAllByText('1 órdenes')).toHaveLength(2);
        });

        it('muestra el mensaje de error si falla la transformación de órdenes', async () => {
            (OrderService.getOrdenesActivas as jest.Mock).mockResolvedValue({
                content: [
                    {
                        idOrden: 101,
                        idUsuarioDisenador: 5,
                        idCliente: 10,
                        idEstatusActual: 2,
                        montoTotal: 300,
                        montoPagado: 100
                    }
                ],
                page: { totalElements: 1 }
            });

            await renderPage();

            expect(screen.getByText('Orden #101')).toBeInTheDocument();
        });
    });

    describe('Paginación y recarga', () => {
        it('carga la siguiente página', async () => {
            await renderPage();

            fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

            await waitFor(() => {
                expect(OrderService.getOrdenesActivas).toHaveBeenLastCalledWith(1, 10);
            });
        });

        it('carga la página con cinco registros', async () => {
            await renderPage();

            fireEvent.click(screen.getByRole('button', { name: 'Mostrar cinco' }));

            await waitFor(() => {
                expect(OrderService.getOrdenesActivas).toHaveBeenLastCalledWith(0, 5);
            });
        });

        it('recarga las órdenes al pulsar el botón correspondiente', async () => {
            await renderPage();

            fireEvent.click(screen.getByRole('button', { name: 'Recargar' }));

            await waitFor(() => {
                expect(OrderService.getOrdenesActivas).toHaveBeenCalledTimes(2);
            });

            expect(OrderService.getOrdenesActivas).toHaveBeenLastCalledWith(0, 10);
        });

        it('permite volver a la caja', async () => {
            await renderPage();

            expect(screen.getByRole('link', { name: /Volver/i })).toHaveAttribute(
                'href',
                '/counter'
            );
        });

        it('permite abrir el seguimiento de una orden', async () => {
            await renderPage();
            const trackingLinks = screen.getAllByRole('link', {
                name: 'Seguimiento'
            });
            expect(trackingLinks).toHaveLength(4);
            expect(trackingLinks[0]).toHaveAttribute(
                'href',
                '/timeline?id=101'
            );
        });

    });

    describe('Cancelación de órdenes', () => {
        const openCancellation = async () => {
            await renderPage();

            fireEvent.click(
                screen.getAllByRole('button', { name: 'Cancelar Orden' })[0]
            );

            expect(
                await screen.findByText('Confirmar Cancelación')
            ).toBeInTheDocument();
        };

        it('abre el diálogo de cancelación', async () => {
            await openCancellation();

            expect(
                screen.getByText('¿Cuál es el motivo de la cancelación?')
            ).toBeInTheDocument();

            expect(
                screen.getByText('Acción irreversible')
            ).toBeInTheDocument();
        });

        it('mantiene deshabilitada la confirmación si no se selecciona un motivo', async () => {
            await openCancellation();

            expect(
                screen.getByRole('button', { name: 'Confirmar cancelación' })
            ).toBeDisabled();
        });

        it('permite cerrar el diálogo de cancelación', async () => {
            await openCancellation();

            fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

            await waitFor(() => {
                expect(
                    screen.queryByText('Confirmar Cancelación')
                ).not.toBeInTheDocument();
            });
        });

        it('cancela la orden con el motivo y usuario seleccionados', async () => {
            await openCancellation();

            fireEvent.change(
                screen.getByLabelText('¿Cuál es el motivo de la cancelación?'),
                { target: { value: '1' } }
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Confirmar cancelación' })
            );

            await waitFor(() => {
                expect(OrderService.cancelarOrden).toHaveBeenCalledWith(101, 1, 99);
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Orden Cancelada'
                })
            );

            await waitFor(() => {
                expect(
                    screen.queryByText('Confirmar Cancelación')
                ).not.toBeInTheDocument();
            });
        });

        it('muestra una advertencia si se intenta confirmar sin motivo', async () => {
            await openCancellation();

            fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));

            expect(OrderService.cancelarOrden).not.toHaveBeenCalled();
        });

        it('muestra un error si falla la cancelación', async () => {
            (OrderService.cancelarOrden as jest.Mock).mockRejectedValue(
                new Error('No fue posible cancelar')
            );

            await openCancellation();

            fireEvent.change(
                screen.getByLabelText('¿Cuál es el motivo de la cancelación?'),
                { target: { value: '2' } }
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Confirmar cancelación' })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        detail: 'No fue posible cancelar'
                    })
                );
            });
        });

        it('no cancela la orden si no hay un usuario registrado', async () => {
            localStorage.removeItem('user');

            await openCancellation();

            fireEvent.change(
                screen.getByLabelText('¿Cuál es el motivo de la cancelación?'),
                { target: { value: '1' } }
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Confirmar cancelación' })
            );

            await waitFor(() => {
                expect(OrderService.cancelarOrden).not.toHaveBeenCalled();
            });
        });
    });

    describe('Entrega de órdenes', () => {
        const openDelivery = async (orderIndex = 0) => {
            await renderPage();

            fireEvent.click(
                screen.getAllByRole('button', {
                    name: 'Marcar como Entregada'
                })[orderIndex]
            );
        };

        it('abre la confirmación para una orden sin adeudo', async () => {
            await openDelivery(0);

            expect(
                await screen.findByText('Confirmar Entrega')
            ).toBeInTheDocument();

            expect(
                screen.getByText(/¿Confirmas que el cliente ha recibido sus productos/)
            ).toBeInTheDocument();

            expect(
                screen.getByRole('button', { name: 'Entregar Orden' })
            ).toBeInTheDocument();
        });

        it('registra la entrega con el estatus destino correcto', async () => {
            await openDelivery(0);

            fireEvent.click(
                await screen.findByRole('button', { name: 'Entregar Orden' })
            );

            await waitFor(() => {
                expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(102, {
                    idUsuario: 99,
                    idEstatusDestino: 12,
                    clienteAprobo: true
                });
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Entregada'
                })
            );
        });

        it('bloquea la entrega cuando existe un adeudo', async () => {
            await openDelivery(1);

            expect(
                await screen.findByText('¡Orden con Adeudo!')
            ).toBeInTheDocument();

            expect(screen.getByText('Pago Pendiente')).toBeInTheDocument();
            expect(screen.getByText('$200.00')).toBeInTheDocument();

            expect(
                screen.queryByRole('button', { name: 'Entregar Orden' })
            ).not.toBeInTheDocument();

            expect(
                screen.getByRole('button', { name: 'Ir a Caja' })
            ).toBeInTheDocument();

            expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
        });

        it('permite cerrar el diálogo de entrega', async () => {
            await openDelivery(0);

            await screen.findByText('Confirmar Entrega');

            fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

            await waitFor(() => {
                expect(
                    screen.queryByText('Confirmar Entrega')
                ).not.toBeInTheDocument();
            });
        });

        it('muestra un error si falla el registro de la entrega', async () => {
            const consoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            (OrderService.avanzarEstatus as jest.Mock).mockRejectedValue(
                new Error('Error al entregar')
            );

            await openDelivery(0);

            fireEvent.click(
                await screen.findByRole('button', { name: 'Entregar Orden' })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        detail: 'No se pudo registrar la entrega.'
                    })
                );
            });

            consoleError.mockRestore();
        });

        it('no registra la entrega si no hay un usuario registrado', async () => {
            localStorage.removeItem('user');

            await openDelivery(0);

            fireEvent.click(
                await screen.findByRole('button', { name: 'Entregar Orden' })
            );

            await waitFor(() => {
                expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
            });
        });
    });
});
