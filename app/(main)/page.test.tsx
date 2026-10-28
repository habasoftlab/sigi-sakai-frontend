
import React from 'react';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './page';
import { OrderService } from '@/app/service/orderService';
import { UserService } from '@/app/service/userService';
import { ClientService } from '@/app/service/clientService';
import { DashboardService } from '@/app/service/dashboardService';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockShowToast = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace
    })
}));

jest.mock('../../layout/context/layoutcontext', () => {
    const React = jest.requireActual('react');
    return {
        LayoutContext: React.createContext({
            layoutConfig: { colorScheme: 'light' }
        })
    };
});

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

jest.mock('primereact/chart', () => ({
    Chart: ({ type, data }: any) => (
        <div
            data-testid={`chart-${type}`}
            data-labels={JSON.stringify(data?.labels ?? [])}
        />
    )
}));

jest.mock('primereact/api', () => ({
    FilterMatchMode: { CONTAINS: 'contains' }
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

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children }: any) => <>{children}</>
}));

jest.mock('primereact/dropdown', () => ({
    Dropdown: ({
        id,
        value,
        options = [],
        optionLabel = 'label',
        optionValue = 'value',
        onChange,
        placeholder
    }: any) => (
        <select
            id={id}
            aria-label={id || 'Periodo'}
            value={value ?? ''}
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
    Dialog: ({
        visible,
        header,
        children,
        footer,
        onHide
    }: any) =>
        visible ? (
            <div role="dialog" aria-label="Dialog">
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
                        {value.length ? (
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
                    aria-label="Página siguiente"
                    onClick={() => onPage?.({ first: 5, rows: 5 })}
                >
                    Página siguiente
                </button>
            </div>
        );
    }
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getEstatusOperaciones: jest.fn(),
        getRazonesCancelacion: jest.fn(),
        getOrdenesActivas: jest.fn(),
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

jest.mock('@/app/service/dashboardService', () => ({
    DashboardService: {
        getCotizacionesGrafica: jest.fn(),
        getOrdenesGrafica: jest.fn(),
        getEgresosGrafica: jest.fn(),
        getIngresosGrafica: jest.fn()
    }
}));

const mockDesigners = [
    { idUsuario: 5, nombre: 'Ana Diseñadora' }
];

const mockClients = [
    { id: 10, nombre: 'Cliente Demo' }
];

const mockStatuses = [
    { idEstatus: 2, descripcion: 'En proceso' },
    { idEstatus: 6, descripcion: 'Lista para entrega' }
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
        idCliente: 10,
        idEstatusActual: 6,
        montoTotal: 500,
        montoPagado: 500,
        fechaCreacion: '2026-10-21T12:00:00'
    }
];

const mockOrderResponse = () => ({
    content: mockOrders,
    page: { totalElements: 12 }
});

const configureServices = () => {
    jest.mocked(UserService.getDesigners).mockResolvedValue(mockDesigners as any);
    jest.mocked(ClientService.getAll).mockResolvedValue(mockClients as any);

    jest.mocked(OrderService.getEstatusOperaciones).mockResolvedValue(
        mockStatuses as any
    );
    jest.mocked(OrderService.getRazonesCancelacion).mockResolvedValue(
        mockReasons as any
    );
    jest.mocked(OrderService.getOrdenesActivas).mockImplementation(
        async () => mockOrderResponse() as any
    );
    jest.mocked(OrderService.cancelarOrden).mockResolvedValue(undefined as any);
    jest.mocked(OrderService.avanzarEstatus).mockResolvedValue(undefined as any);

    jest.mocked(DashboardService.getCotizacionesGrafica).mockResolvedValue([
        { label: 'Lunes', totalCotizaciones: 3 },
        { label: 'Martes', totalCotizaciones: 2 }
    ] as any);

    jest.mocked(DashboardService.getOrdenesGrafica).mockResolvedValue([
        { label: 'Lunes', totalOrdenes: 4 },
        { label: 'Martes', totalOrdenes: 1 }
    ] as any);

    jest.mocked(DashboardService.getEgresosGrafica).mockResolvedValue({
        datosGrafica: [{ label: 'Lunes', total: 100 }]
    } as any);

    jest.mocked(DashboardService.getIngresosGrafica).mockResolvedValue({
        datosGrafica: [{ label: 'Lunes', value: 200 }],
        montoPagado: 200
    } as any);
};

describe('Dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'token-prueba');
        localStorage.setItem(
            'user',
            JSON.stringify({ idUsuario: 7, token: 'token-prueba' })
        );
        configureServices();
    });

    describe('Autorización', () => {
        it('muestra el dashboard cuando existe un token', async () => {
            render(<Dashboard />);

            expect(
                await screen.findByText('Resumen operativo')
            ).toBeInTheDocument();

            expect(mockReplace).not.toHaveBeenCalled();
        });

        it('redirige al login cuando no existe un token', async () => {
            localStorage.removeItem('token');
            localStorage.setItem(
                'user',
                JSON.stringify({ idUsuario: 7 })
            );

            render(<Dashboard />);

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/auth/login');
            });

            expect(screen.queryByText('Resumen operativo')).not.toBeInTheDocument();
        });

        it('obtiene el token de los datos del usuario si no está en localStorage directamente', async () => {
            localStorage.removeItem('token');

            render(<Dashboard />);

            expect(
                await screen.findByText('Resumen operativo')
            ).toBeInTheDocument();

            expect(mockReplace).not.toHaveBeenCalled();
        });
    });

    describe('Resumen y gráficas', () => {
        it('muestra las tarjetas de resumen', async () => {
            render(<Dashboard />);

            expect(await screen.findByText('Ingresos del periodo')).toBeInTheDocument();
            expect(screen.getByText('Cotizaciones del periodo')).toBeInTheDocument();
            expect(screen.getByText('Órdenes del periodo')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getAllByText('5', { selector: 'div' })).toHaveLength(2);
            });
        });

        it('carga las dos gráficas', async () => {
            render(<Dashboard />);

            expect(await screen.findByTestId('chart-bar')).toBeInTheDocument();
            expect(screen.getByTestId('chart-line')).toBeInTheDocument();
        });

        it('consulta los servicios de gráficas con el filtro inicial', async () => {
            render(<Dashboard />);

            await waitFor(() => {
                expect(
                    DashboardService.getCotizacionesGrafica
                ).toHaveBeenCalledWith('semana');
                expect(
                    DashboardService.getOrdenesGrafica
                ).toHaveBeenCalledWith('semana');
                expect(
                    DashboardService.getEgresosGrafica
                ).toHaveBeenCalledWith('semana');
                expect(
                    DashboardService.getIngresosGrafica
                ).toHaveBeenCalledWith('semana');
            });
        });

        it('actualiza las gráficas al cambiar el período', async () => {
            render(<Dashboard />);

            await screen.findByTestId('chart-bar');

            fireEvent.change(screen.getByRole('combobox', { name: 'Periodo' }), {
                target: { value: 'mes' }
            });

            await waitFor(() => {
                expect(
                    DashboardService.getCotizacionesGrafica
                ).toHaveBeenCalledWith('mes');
                expect(
                    DashboardService.getOrdenesGrafica
                ).toHaveBeenCalledWith('mes');
            });
        });

        it('navega al módulo financiero al pulsar costos operativos', async () => {
            render(<Dashboard />);

            fireEvent.click(await screen.findByText('Costos operativos'));

            expect(mockPush).toHaveBeenCalledWith('/finance');
        });

        it('registra el error si falla la carga de gráficas', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            jest.mocked(
                DashboardService.getCotizacionesGrafica
            ).mockRejectedValueOnce(new Error('Error de gráficas'));

            render(<Dashboard />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error al cargar las gráficas',
                    expect.any(Error)
                );
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Tabla de órdenes', () => {
        it('carga las órdenes y los catálogos', async () => {
            render(<Dashboard />);

            expect(await screen.findByText('Orden #101')).toBeInTheDocument();
            expect(screen.getByText('Orden #102')).toBeInTheDocument();

            expect(UserService.getDesigners).toHaveBeenCalled();
            expect(ClientService.getAll).toHaveBeenCalled();
            expect(OrderService.getEstatusOperaciones).toHaveBeenCalled();
            expect(OrderService.getRazonesCancelacion).toHaveBeenCalled();
            expect(OrderService.getOrdenesActivas).toHaveBeenCalledWith(0, 5);
        });

        it('muestra el nombre del cliente y del diseñador', async () => {
            render(<Dashboard />);

            expect(await screen.findByText('Ana Diseñadora')).toBeInTheDocument();
            expect(screen.getAllByText('Cliente Demo')).toHaveLength(2);
        });

        it('muestra el saldo pendiente de una orden', async () => {
            render(<Dashboard />);

            expect(await screen.findByText('Resta: $200.00')).toBeInTheDocument();
        });

        it('muestra los estados de las órdenes', async () => {
            render(<Dashboard />);

            await screen.findByText('Orden #101');

            expect(screen.getByText('En proceso')).toBeInTheDocument();
            expect(screen.getByText('Lista para entrega')).toBeInTheDocument();
        });

        it('carga la página siguiente de órdenes', async () => {
            render(<Dashboard />);

            await screen.findByText('Orden #101');

            fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

            await waitFor(() => {
                expect(OrderService.getOrdenesActivas).toHaveBeenCalledWith(1, 5);
            });
        });

        it('permite recargar las órdenes', async () => {
            render(<Dashboard />);

            await screen.findByText('Orden #101');

            fireEvent.click(screen.getByRole('button', { name: 'Recargar' }));

            await waitFor(() => {
                expect(OrderService.getOrdenesActivas).toHaveBeenCalledTimes(2);
            });
        });

        it('registra un error cuando falla la carga de órdenes', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            jest.mocked(OrderService.getOrdenesActivas).mockRejectedValueOnce(
                new Error('Error de órdenes')
            );

            render(<Dashboard />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error cargando ordenes:',
                    expect.any(Error)
                );
            });

            consoleSpy.mockRestore();
        });

        it('registra un error si falla la carga de catálogos', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            jest.mocked(UserService.getDesigners).mockRejectedValueOnce(
                new Error('Error de catálogos')
            );

            render(<Dashboard />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Error inicializando catálogos:',
                    expect.any(Error)
                );
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Cancelación de órdenes', () => {
        const openCancellation = async () => {
            render(<Dashboard />);

            await screen.findByText('Orden #101');

            fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

            return screen.getByRole('dialog', { name: 'Dialog' });
        };

        it('abre el diálogo de cancelación', async () => {
            const dialog = await openCancellation();

            expect(
                within(dialog).getByText('Confirmar Cancelación')
            ).toBeInTheDocument();
            expect(
                within(dialog).getByText('Acción irreversible')
            ).toBeInTheDocument();
        });

        it('deshabilita la confirmación hasta elegir una razón', async () => {
            const dialog = await openCancellation();

            expect(
                within(dialog).getByRole('button', {
                    name: 'Confirmar cancelación'
                })
            ).toBeDisabled();
        });

        it('permite cerrar el diálogo', async () => {
            const dialog = await openCancellation();

            fireEvent.click(
                within(dialog).getByRole('button', { name: 'Volver' })
            );

            expect(
                screen.queryByText('Acción irreversible')
            ).not.toBeInTheDocument();
        });

        it('cancela una orden al seleccionar una razón', async () => {
            const dialog = await openCancellation();

            fireEvent.change(
                within(dialog).getByLabelText(
                    '¿Cuál es el motivo de la cancelación?'
                ),
                { target: { value: '1' } }
            );

            fireEvent.click(
                within(dialog).getByRole('button', {
                    name: 'Confirmar cancelación'
                })
            );

            await waitFor(() => {
                expect(OrderService.cancelarOrden).toHaveBeenCalledWith(
                    101,
                    1,
                    7
                );
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Orden Cancelada',
                    detail: 'La orden ha sido dada de baja.'
                })
            );
        });

        it('muestra un error cuando falla la cancelación', async () => {
            jest.mocked(OrderService.cancelarOrden).mockRejectedValueOnce(
                new Error('No se pudo cancelar')
            );

            const dialog = await openCancellation();

            fireEvent.change(
                within(dialog).getByLabelText(
                    '¿Cuál es el motivo de la cancelación?'
                ),
                { target: { value: '1' } }
            );

            fireEvent.click(
                within(dialog).getByRole('button', {
                    name: 'Confirmar cancelación'
                })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cancelar'
                    })
                );
            });
        });

        it('no cancela si el usuario no tiene identificador', async () => {
            localStorage.setItem('user', JSON.stringify({ token: 'token-prueba' }));

            const dialog = await openCancellation();

            fireEvent.change(
                within(dialog).getByLabelText(
                    '¿Cuál es el motivo de la cancelación?'
                ),
                { target: { value: '1' } }
            );

            fireEvent.click(
                within(dialog).getByRole('button', {
                    name: 'Confirmar cancelación'
                })
            );

            await waitFor(() => {
                expect(OrderService.cancelarOrden).not.toHaveBeenCalled();
            });
        });
    });

    describe('Entrega de órdenes', () => {
        const openDelivery = async () => {
            render(<Dashboard />);

            await screen.findByText('Orden #102');

            fireEvent.click(screen.getByRole('button', { name: 'Entregar' }));

            return screen.getByRole('dialog', { name: 'Dialog' });
        };

        it('abre el diálogo para confirmar la entrega', async () => {
            const dialog = await openDelivery();

            expect(
                within(dialog).getByText('Confirmar Entrega')
            ).toBeInTheDocument();
            expect(
                within(dialog).getByText(
                    '¿Confirmas que el cliente ha recibido sus productos satisfactoriamente?'
                )
            ).toBeInTheDocument();
        });

        it('registra la entrega de una orden sin adeudo', async () => {
            const dialog = await openDelivery();

            fireEvent.click(
                within(dialog).getByRole('button', {
                    name: 'Entregar Orden'
                })
            );

            await waitFor(() => {
                expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(
                    102,
                    {
                        idUsuario: 7,
                        idEstatusDestino: 12,
                        clienteAprobo: true
                    }
                );
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Entregada',
                    detail: 'Orden marcada como entregada.'
                })
            );
        });

        it('muestra el adeudo y no permite entregar una orden con saldo pendiente', async () => {
            jest.mocked(OrderService.getOrdenesActivas).mockResolvedValue({
                content: [
                    {
                        ...mockOrders[1],
                        montoPagado: 300
                    }
                ],
                page: { totalElements: 1 }
            } as any);

            render(<Dashboard />);

            await screen.findByText('Orden #102');

            fireEvent.click(screen.getByRole('button', { name: 'Entregar' }));

            const dialog = screen.getByRole('dialog', { name: 'Dialog' });

            expect(within(dialog).getByText('¡Orden con Adeudo!')).toBeInTheDocument();
            expect(within(dialog).getByText('Pago Pendiente')).toBeInTheDocument();
            expect(within(dialog).getByText('$200.00')).toBeInTheDocument();
            expect(
                within(dialog).queryByRole('button', { name: 'Entregar Orden' })
            ).not.toBeInTheDocument();
        });

        it('muestra un error cuando falla la entrega', async () => {
            jest.mocked(OrderService.avanzarEstatus).mockRejectedValueOnce(
                new Error('Error de entrega')
            );

            const dialog = await openDelivery();

            fireEvent.click(
                within(dialog).getByRole('button', {
                    name: 'Entregar Orden'
                })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo registrar la entrega.'
                    })
                );
            });
        });

        it('no registra la entrega si el usuario no tiene identificador', async () => {
            localStorage.setItem('user', JSON.stringify({ token: 'token-prueba' }));

            const dialog = await openDelivery();

            fireEvent.click(
                within(dialog).getByRole('button', {
                    name: 'Entregar Orden'
                })
            );

            await waitFor(() => {
                expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
            });
        });

        it('permite cerrar el diálogo de entrega', async () => {
            const dialog = await openDelivery();

            fireEvent.click(
                within(dialog).getByRole('button', { name: 'Cancelar' })
            );

            expect(
                screen.queryByText(
                    '¿Confirmas que el cliente ha recibido sus productos satisfactoriamente?'
                )
            ).not.toBeInTheDocument();
        });
    });
});
