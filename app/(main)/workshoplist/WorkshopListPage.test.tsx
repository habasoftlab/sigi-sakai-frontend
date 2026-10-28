import React from 'react';
import {
    act,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import WorkshopListPage from './page';
import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';

const mockShowToast = jest.fn();

jest.mock('primereact/toast', () => {
    const React = jest.requireActual('react');

    return {
        Toast: React.forwardRef((_props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                show: mockShowToast,
            }));

            return null;
        }),
    };
});

jest.mock('primereact/card', () => ({
    Card: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('primereact/button', () => ({
    Button: ({
        icon,
        disabled,
        onClick,
        tooltip,
        tooltipOptions,
        label,
        severity,
        rounded,
        text,
        outlined,
        loading,
        className,
        ...props
    }: any) => (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={tooltip}
            aria-label={label || icon || 'Botón'}
            className={className}
            {...props}
        >
            {label}
        </button>
    ),
}));

jest.mock('primereact/column', () => ({
    Column: () => null,
}));

jest.mock('primereact/datatable', () => {
    const React = jest.requireActual('react');

    return {
        DataTable: ({
            value = [],
            loading,
            emptyMessage,
            children,
        }: any) => {
            const columns = React.Children.toArray(
                children
            ) as React.ReactElement[];

            return (
                <div
                    data-testid="workshop-table"
                    data-loading={String(loading)}
                >
                    {value.length === 0 ? (
                        <p>{emptyMessage}</p>
                    ) : (
                        <table>
                            <tbody>
                                {value.map((row: any) => (
                                    <tr key={row.idOrden}>
                                        {columns.map(
                                            (column, index) => {
                                                const { field, body } =
                                                    column.props;

                                                return (
                                                    <td key={index}>
                                                        {body
                                                            ? body(row)
                                                            : field
                                                                ? row[field]
                                                                : null}
                                                    </td>
                                                );
                                            }
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            );
        },
    };
});

jest.mock('next/link', () => {
    const React = jest.requireActual('react');

    return {
        __esModule: true,
        default: ({
            children,
            href,
            passHref,
            legacyBehavior,
            ...props
        }: any) => {
            if (React.isValidElement(children) && children.type === 'a') {
                return React.cloneElement(children, {
                    href,
                    ...props,
                });
            }

            return (
                <a href={href} {...props}>
                    {children}
                </a>
            );
        },
    };
});

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getOrdenesActivas: jest.fn(),
    },
}));

jest.mock('@/app/service/clientService', () => ({
    ClientService: {
        getAll: jest.fn(),
    },
}));

const mockOrders = [
    {
        idOrden: 101,
        montoTotal: 1500,
        idCliente: 1,
        idEstatusActual: 9,
        rutaArchivo: '/uploads/diseno101.pdf',
        insumosVerificados: true,
        fechaEntregaFormal: '2026-10-25T12:00:00',
    },
    {
        idOrden: 102,
        montoTotal: 2500,
        idCliente: 2,
        idEstatusActual: 2,
        rutaArchivo: 'Pendiente',
        insumosVerificados: false,
        fechaEntregaFormal: undefined,
    },
    {
        idOrden: 103,
        montoTotal: 3000,
        idCliente: 3,
        idEstatusActual: 5,
        rutaArchivo: '/uploads/diseno103.pdf',
        insumosVerificados: true,
    },
    {
        idOrden: 104,
        montoTotal: 4500,
        idCliente: 1,
        idEstatusActual: 7,
        rutaArchivo: '/uploads/diseno104.pdf',
        insumosVerificados: false,
    },
    {
        idOrden: 105,
        montoTotal: 500,
        idCliente: 1,
        idEstatusActual: 12,
        rutaArchivo: '/uploads/diseno105.pdf',
        insumosVerificados: true,
    },
];

const mockClients = [
    {
        id: 1,
        nombre: 'Imprenta Ejemplo',
    },
    {
        id: 2,
        nombre: 'Cliente Prueba',
    },
];

const renderPage = () => render(<WorkshopListPage />);

const loadPage = async (
    orders: any[] = mockOrders,
    clients: any[] = mockClients
) => {
    (OrderService.getOrdenesActivas as jest.Mock).mockResolvedValue({
        content: orders,
    });

    (ClientService.getAll as jest.Mock).mockResolvedValue(clients);

    renderPage();

    // Espera a que finalice la carga y se actualice la tabla.
    await waitFor(() => {
        expect(
            screen.getByTestId('workshop-table')
        ).toHaveAttribute('data-loading', 'false');
    });
};

beforeEach(() => {
    jest.clearAllMocks();

    (OrderService.getOrdenesActivas as jest.Mock).mockResolvedValue({
        content: mockOrders,
    });

    (ClientService.getAll as jest.Mock).mockResolvedValue(mockClients);
});

describe('WorkshopListPage', () => {
    it('debe mostrar el encabezado y las categorías de órdenes', async () => {
        await loadPage();

        expect(
            screen.getByText('Bienvenido, Jefe de taller')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Por revisar insumos')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Insumos listos')
        ).toBeInTheDocument();

        expect(
            screen.getByText('En espera de insumos')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Listo para impresión')
        ).toBeInTheDocument();
    });

    it('debe consultar las órdenes activas y los clientes', async () => {
        await loadPage();

        expect(OrderService.getOrdenesActivas).toHaveBeenCalledWith(
            0,
            100
        );

        expect(ClientService.getAll).toHaveBeenCalledTimes(1);
    });

    it('debe excluir las órdenes con estatus 12', async () => {
        await loadPage();

        expect(screen.getByText('101')).toBeInTheDocument();
        expect(screen.getByText('102')).toBeInTheDocument();
        expect(screen.getByText('103')).toBeInTheDocument();
        expect(screen.getByText('104')).toBeInTheDocument();
        expect(screen.queryByText('105')).not.toBeInTheDocument();
    });

    it('debe mostrar el nombre del cliente asociado a cada orden', async () => {
        await loadPage();

        const table = screen.getByTestId('workshop-table');

        expect(
            within(table).getAllByText('Imprenta Ejemplo')
        ).toHaveLength(2);

        expect(
            within(table).getByText('Cliente Prueba')
        ).toBeInTheDocument();
    });

    it('debe utilizar un nombre alternativo cuando no encuentra al cliente', async () => {
        await loadPage([mockOrders[2]], mockClients);

        expect(
            screen.getByText('Cliente #3')
        ).toBeInTheDocument();
    });

    it('debe mostrar los importes con formato de moneda mexicana', async () => {
        await loadPage([mockOrders[0]], mockClients);

        expect(
            screen.getByText(
                (1500).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                })
            )
        ).toBeInTheDocument();
    });

    it('debe mostrar el enlace para revisar los insumos pendientes', async () => {
        await loadPage([mockOrders[1]], mockClients);

        const link = document.querySelector(
            'a[href="/workshopsupplies?id=102"]'
        );

        expect(link).toBeInTheDocument();

        expect(
            screen.getByTitle(
                'Pendiente de revisión'
            )
        ).toBeInTheDocument();
    });

    it('debe mostrar los insumos verificados sin enlace de revisión', async () => {
        await loadPage([mockOrders[0]], mockClients);

        expect(
            screen.queryByTitle('Pendiente de revisión (Clic para verificar)')
        ).not.toBeInTheDocument();

        expect(
            screen.getByTitle('Insumos verificados y listos')
        ).toBeInTheDocument();

        expect(
            screen.getByTitle('Enviar a impresión')
        ).toBeInTheDocument();
    });

    it('debe habilitar la impresión cuando el diseño y los insumos están listos', async () => {
        await loadPage([mockOrders[0]], mockClients);

        const printLink = screen.getByTitle('Enviar a impresión');

        expect(printLink).toHaveAttribute(
            'href',
            '/workshopprint?id=101'
        );
    });

    it('debe deshabilitar la impresión cuando falta el archivo de diseño', async () => {
        await loadPage([mockOrders[1]], mockClients);

        const button = screen.getByRole('button', {
            name: 'pi pi-print text-300',
        });

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute(
            'title',
            'Falta archivo de diseño'
        );
    });

    it('debe deshabilitar la impresión cuando faltan insumos', async () => {
        await loadPage([mockOrders[3]], mockClients);

        const button = screen.getByRole('button', {
            name: 'pi pi-print text-300',
        });

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('title', 'Faltan insumos');
    });

    it('debe deshabilitar la impresión cuando el diseño no está aprobado', async () => {
        const order = {
            ...mockOrders[0],
            idEstatusActual: 7,
        };

        await loadPage([order], mockClients);

        const button = screen.getByRole('button', {
            name: 'pi pi-print text-300',
        });

        expect(button).toBeDisabled();

        expect(button).toHaveAttribute(
            'title',
            'Diseño no aprobado por cliente aún'
        );
    });

    it('debe mostrar un mensaje cuando no existen órdenes pendientes', async () => {
        await loadPage([], mockClients);

        expect(
            screen.getByText('No hay órdenes pendientes en taller.')
        ).toBeInTheDocument();
    });

    it('debe mostrar un mensaje de error si falla la carga de datos', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenesActivas as jest.Mock).mockRejectedValue(
            new Error('Error de conexión')
        );

        (ClientService.getAll as jest.Mock).mockResolvedValue(mockClients);

        try {
            renderPage();

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cargar la lista de trabajo.',
                    })
                );
            });

            expect(
                screen.getByTestId('workshop-table')
            ).toHaveAttribute('data-loading', 'false');
        } finally {
            consoleError.mockRestore();
        }
    });

    it('debe admitir una respuesta de órdenes como arreglo directo', async () => {
        (OrderService.getOrdenesActivas as jest.Mock).mockResolvedValue(
            [mockOrders[0]]
        );

        await loadPage([mockOrders[0]], mockClients);

        expect(screen.getByText('101')).toBeInTheDocument();
    });
});