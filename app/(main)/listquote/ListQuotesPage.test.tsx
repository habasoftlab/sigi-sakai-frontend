import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListQuotePage from '@/app/(main)/listquote/page';
import { OrderService } from '@/app/service/orderService';
import { UserService } from '@/app/service/userService';
import { ClientService } from '@/app/service/clientService';

const mockShowToast = jest.fn();

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: any) => {
        const React = jest.requireActual('react');

        if (React.isValidElement(children) && children.type === 'a') {
            return React.cloneElement(children, { href } as any);
        }

        return <a href={href}>{children}</a>;
    }
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
        icon,
        onClick,
        label,
        rounded,
        text,
        severity,
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
        />
    )
}));

jest.mock('primereact/tag', () => ({
    Tag: ({ value, severity }: any) => (
        <span data-testid={`tag-${value}`} data-severity={severity}>
            {value}
        </span>
    )
}));

jest.mock('primereact/column', () => ({
    Column: () => null
}));

jest.mock('primereact/treetable', () => ({
    TreeTable: ({
        value = [],
        children,
        loading,
        emptyMessage,
        onPage,
        first,
        rows,
        totalRecords
    }: any) => {
        const React = jest.requireActual('react');
        const columns = React.Children.toArray(children) as any[];

        const renderNode = (node: any) => (
            <React.Fragment key={node.key}>
                <tr data-testid={node.data.isGroup ? 'quote-group' : 'quote-row'}>
                    {columns.map((column: any, index: number) => {
                        const props = column.props;
                        const content = props.body
                            ? props.body(node)
                            : node.data[props.field];

                        return <td key={index}>{content ?? ''}</td>;
                    })}
                </tr>

                {node.children?.map(renderNode)}
            </React.Fragment>
        );

        return (
            <div>
                {loading && <span role="status">Cargando cotizaciones</span>}

                <table>
                    <thead>
                        <tr>
                            {columns.map((column: any, index: number) => (
                                <th key={index}>{column.props.header}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {value.length > 0
                            ? value.map(renderNode)
                            : (
                                <tr>
                                    <td>{emptyMessage}</td>
                                </tr>
                            )}
                    </tbody>
                </table>

                <div>
                    <span data-testid="pagination-info">
                        {first}-{rows}-{totalRecords}
                    </span>

                    <button
                        type="button"
                        aria-label="Página siguiente"
                        onClick={() =>
                            onPage({
                                first: first + rows,
                                rows
                            })
                        }
                    >
                        Página siguiente
                    </button>

                    <button
                        type="button"
                        aria-label="Cambiar tamaño de página"
                        onClick={() =>
                            onPage({
                                first: 0,
                                rows: 5
                            })
                        }
                    >
                        Mostrar cinco
                    </button>
                </div>
            </div>
        );
    }
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getCotizacionesYCanceladas: jest.fn()
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
    { idUsuario: 1, nombre: 'Ana Diseñadora' },
    { idUsuario: 2, nombre: 'Luis Diseñador' }
];

const mockClients = [
    { id: 101, nombre: 'Imprenta Central' },
    { id: 102, nombre: 'Papelería Norte' }
];

const mockQuotes = [
    {
        idOrden: 1001,
        idUsuarioDisenador: 1,
        idCliente: 101,
        fechaCreacion: '2026-01-15T12:00:00',
        montoTotal: 1500,
        idEstatusActual: 1
    },
    {
        idOrden: 1002,
        idUsuarioDisenador: 1,
        idCliente: 102,
        fechaCreacion: '2026-01-16T12:00:00',
        montoTotal: 2500,
        idEstatusActual: 11
    },
    {
        idOrden: 1003,
        idUsuarioDisenador: 2,
        idCliente: 999,
        fechaCreacion: '2026-01-17T12:00:00',
        montoTotal: 500,
        idEstatusActual: 5
    },
    {
        idOrden: 1004,
        idUsuarioDisenador: undefined,
        fechaCreacion: '2026-01-18T12:00:00',
        montoTotal: 300,
        idEstatusActual: 1
    }
];

const configureServices = () => {
    (UserService.getDesigners as jest.Mock).mockResolvedValue(mockDesigners);
    (ClientService.getAll as jest.Mock).mockResolvedValue(mockClients);

    (OrderService.getCotizacionesYCanceladas as jest.Mock).mockResolvedValue({
        content: mockQuotes,
        page: {
            totalElements: 4
        }
    });
};

const renderPage = async () => {
    render(<ListQuotePage />);

    expect(
        await screen.findByText('Lista de cotizaciones')
    ).toBeInTheDocument();
};

beforeEach(() => {
    jest.clearAllMocks();
    configureServices();
});

describe('ListQuotePage', () => {
    describe('Carga inicial', () => {
        it('muestra el título, la descripción y los encabezados', async () => {
            await renderPage();

            expect(screen.getByText('Agrupadas por diseñador asignado')).toBeInTheDocument();
            expect(screen.getByText('Referencia')).toBeInTheDocument();
            expect(screen.getByText('Cliente')).toBeInTheDocument();
            expect(screen.getByText('Fecha')).toBeInTheDocument();
            expect(screen.getByText('Monto Total')).toBeInTheDocument();
            expect(screen.getByText('Estatus')).toBeInTheDocument();
        });

        it('consulta diseñadores, clientes y cotizaciones', async () => {
            await renderPage();

            await waitFor(() => {
                expect(UserService.getDesigners).toHaveBeenCalledTimes(1);
                expect(ClientService.getAll).toHaveBeenCalledTimes(1);
                expect(OrderService.getCotizacionesYCanceladas).toHaveBeenCalledWith(0, 10);
            });
        });

        it('muestra las cotizaciones agrupadas por diseñador', async () => {
            await renderPage();

            expect(await screen.findByText('Ana Diseñadora')).toBeInTheDocument();
            expect(screen.getByText('Luis Diseñador')).toBeInTheDocument();
            expect(screen.getByText('Sin Asignar / Mostrador')).toBeInTheDocument();

            expect(screen.getByText('2 registros')).toBeInTheDocument();
            expect(screen.getAllByText('1 registros')).toHaveLength(2);
        });

        it('muestra los nombres de clientes y el identificador cuando no encuentra el cliente', async () => {
            await renderPage();

            expect(await screen.findAllByText('Imprenta Central')).not.toHaveLength(0);
            expect(screen.getByText('Papelería Norte')).toBeInTheDocument();
            expect(screen.getByText('Cliente #999')).toBeInTheDocument();
        });

        it('muestra los valores predeterminados cuando faltan diseñador o cliente', async () => {
            await renderPage();

            expect(
                await screen.findByText('Sin Asignar / Mostrador')
            ).toBeInTheDocument();

            const unassignedGroup = screen
                .getAllByTestId('quote-group')
                .find(group =>
                    group.textContent?.includes('Sin Asignar / Mostrador')
                );

            expect(unassignedGroup).toBeDefined();

            const unassignedRows = screen
                .getAllByTestId('quote-row')
                .filter(row =>
                    row.textContent?.includes('Cotización #1004')
                );

            expect(unassignedRows).toHaveLength(1);
            expect(unassignedRows[0]).toHaveTextContent('Público General');
        });

        it('muestra el enlace para volver al mostrador', async () => {
            await renderPage();

            const link = screen.getByRole('link', { name: /volver/i });

            expect(link).toHaveAttribute('href', '/counter');
        });
    });

    describe('Agrupación y presentación', () => {
        it('calcula el total por diseñador', async () => {
            await renderPage();

            const groups = await screen.findAllByTestId('quote-group');

            expect(within(groups[0]).getByText('$4000.00')).toBeInTheDocument();
            expect(within(groups[1]).getByText('$500.00')).toBeInTheDocument();
        });

        it('muestra las referencias de cotización y cancelación', async () => {
            await renderPage();

            expect(await screen.findByText('Cotización #1001')).toBeInTheDocument();
            expect(screen.getByText('Cancelada #1002')).toBeInTheDocument();
            expect(screen.getByText('Cotización #1003')).toBeInTheDocument();
        });

        it('muestra el estatus correspondiente a cada cotización', async () => {
            await renderPage();

            const quotationTags = await screen.findAllByTestId('tag-Cotización');
            const cancelledTag = screen.getByTestId('tag-Cancelada');
            const registeredTag = screen.getByTestId('tag-Registrado');

            expect(quotationTags.length).toBeGreaterThan(0);

            quotationTags.forEach(tag => {
                expect(tag).toHaveAttribute('data-severity', 'warning');
            });

            expect(cancelledTag).toHaveAttribute('data-severity', 'danger');
            expect(registeredTag).toHaveAttribute('data-severity', 'info');
        });

        it('formatea las fechas y los montos', async () => {
            await renderPage();

            expect(await screen.findByText('$1500.00')).toBeInTheDocument();
            expect(screen.getByText('$2500.00')).toBeInTheDocument();

            const expectedDate = new Date(
                mockQuotes[0].fechaCreacion
            ).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            expect(screen.getByText(expectedDate)).toBeInTheDocument();
        });
    });

    describe('Paginación', () => {
        it('carga la siguiente página', async () => {
            await renderPage();

            await waitFor(() => {
                expect(OrderService.getCotizacionesYCanceladas).toHaveBeenCalledWith(0, 10);
            });

            (OrderService.getCotizacionesYCanceladas as jest.Mock).mockResolvedValue({
                content: [],
                page: { totalElements: 4 }
            });

            fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

            await waitFor(() => {
                expect(OrderService.getCotizacionesYCanceladas).toHaveBeenLastCalledWith(1, 10);
            });
        });

        it('permite cambiar el tamaño de página', async () => {
            await renderPage();

            fireEvent.click(
                screen.getByRole('button', { name: 'Cambiar tamaño de página' })
            );

            await waitFor(() => {
                expect(OrderService.getCotizacionesYCanceladas).toHaveBeenLastCalledWith(0, 5);
            });
        });
    });

    describe('Actualización', () => {
        it('vuelve a cargar las cotizaciones al pulsar actualizar', async () => {
            await renderPage();

            await waitFor(() => {
                expect(OrderService.getCotizacionesYCanceladas).toHaveBeenCalledTimes(1);
            });

            fireEvent.click(screen.getByRole('button', { name: 'pi pi-refresh' }));

            await waitFor(() => {
                expect(OrderService.getCotizacionesYCanceladas).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Estado vacío y errores', () => {
        it('muestra el mensaje cuando no hay cotizaciones', async () => {
            (OrderService.getCotizacionesYCanceladas as jest.Mock).mockResolvedValue({
                content: [],
                page: { totalElements: 0 }
            });

            await renderPage();

            expect(
                await screen.findByText('No se encontraron cotizaciones en esta página.')
            ).toBeInTheDocument();
        });

        it('muestra un error si falla la carga de cotizaciones', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            (OrderService.getCotizacionesYCanceladas as jest.Mock).mockRejectedValue(
                new Error('Error de cotizaciones')
            );

            await renderPage();

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        detail: 'No se pudieron cargar las cotizaciones'
                    })
                );
            });

            consoleError.mockRestore();
        });

        it('muestra un error si falla la carga de los catálogos', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            (UserService.getDesigners as jest.Mock).mockRejectedValue(
                new Error('Error de diseñadores')
            );

            await renderPage();

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        detail: 'Fallo al cargar catálogos iniciales'
                    })
                );
            });

            consoleError.mockRestore();
        });
    });
});
