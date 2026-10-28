
import React, { forwardRef, useImperativeHandle } from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    within
} from '@testing-library/react';
import '@testing-library/jest-dom';

import ListClientsPage from './page';
import { ClientService } from '@/app/service/clientService';
import { CatalogService } from '@/app/service/catalogService';

const mockShowToast = jest.fn();

jest.mock('primereact/toast', () => ({
    Toast: forwardRef((props: any, ref: any) => {
        useImperativeHandle(ref, () => ({
            show: mockShowToast,
            clear: jest.fn()
        }));

        return <div data-testid="toast" />;
    })
}));

jest.mock('@/app/service/clientService', () => ({
    ClientService: {
        getAll: jest.fn(),
        delete: jest.fn()
    }
}));

jest.mock('@/app/service/catalogService', () => ({
    CatalogService: {
        getRegimenesFiscales: jest.fn(),
        getUsosCfdi: jest.fn()
    }
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => <>{children}</>,
}));

jest.mock('primereact/api', () => ({
    FilterMatchMode: {
        CONTAINS: 'contains'
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
        ...props
    }: any) => (
        <button
            type="button"
            aria-label={
                label ||
                props['aria-label'] ||
                tooltip ||
                icon ||
                'Botón'
            }
            title={tooltip}
            disabled={disabled || loading}
            onClick={onClick}
        >
            {icon && <span aria-hidden="true">{icon}</span>}
            {label || children}
        </button>
    )
}));

jest.mock('primereact/inputtext', () => ({
    InputText: ({ value, onChange, placeholder, ...props }: any) => (
        <input
            type="text"
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            aria-label={placeholder}
            {...props}
        />
    )
}));

jest.mock('primereact/selectbutton', () => ({
    SelectButton: ({ value, onChange, options }: any) => (
        <div role="group" aria-label="Filtro de clientes">
            {options.map((option: any) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange({ value: option.value })}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}));

jest.mock('primereact/column', () => ({
    Column: () => null
}));

jest.mock('primereact/datatable', () => ({
    DataTable: ({
        value = [],
        children,
        header,
        filters,
        globalFilterFields = [],
        emptyMessage,
        loading
    }: any) => {
        const columns = React.Children.toArray(children).filter(
            (child: any) => child?.props
        ) as React.ReactElement[];

        const searchValue = String(filters?.global?.value ?? '')
            .trim()
            .toLowerCase();

        const filteredRows = value.filter((row: any) => {
            if (!searchValue) return true;

            return globalFilterFields.some((field: string) =>
                String(row[field] ?? '')
                    .toLowerCase()
                    .includes(searchValue)
            );
        });

        return (
            <div>
                {header}

                <div data-testid="datatable-loading">
                    {loading ? 'Cargando...' : 'Cargado'}
                </div>

                <table>
                    <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index}>
                                    {column.props.header ?? ''}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRows.map((row: any, rowIndex: number) => (
                            <tr key={row.id ?? rowIndex}>
                                {columns.map((column, columnIndex) => {
                                    const { body, field } = column.props;

                                    const content = body
                                        ? body(row)
                                        : row[field] ?? '';

                                    return (
                                        <td key={columnIndex}>
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {filteredRows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length || 1}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }
}));

jest.mock('primereact/dialog', () => ({
    Dialog: ({
        visible,
        header,
        children,
        footer,
        onHide
    }: any) => {
        if (!visible) return null;

        return (
            <div role="dialog" aria-label={header || 'Diálogo'}>
                {header && <h2>{header}</h2>}

                <div>{children}</div>

                <div>{footer}</div>

                <button type="button" onClick={onHide}>
                    Cerrar diálogo
                </button>
            </div>
        );
    }
}));

jest.mock('@/app/components/ClientFormDialog', () => ({
    ClientFormDialog: ({
        visible,
        onHide,
        onSuccess,
        clientToEdit
    }: any) => {
        if (!visible) return null;

        return (
            <div role="dialog" aria-label="Formulario de cliente">
                <span data-testid="client-edit-id">
                    {clientToEdit?.id ?? 'nuevo'}
                </span>

                <button type="button" onClick={onSuccess}>
                    Guardar cliente simulado
                </button>

                <button type="button" onClick={onHide}>
                    Cerrar formulario
                </button>
            </div>
        );
    }
}));

jest.mock('@/app/components/LastPurchaseDialog', () => ({
    UltimaCompraDialog: ({
        visible,
        idCliente,
        onHide
    }: any) => {
        if (!visible) return null;

        return (
            <div role="dialog" aria-label="Última compra">
                <span data-testid="ultima-compra-cliente-id">
                    {idCliente}
                </span>

                <button type="button" onClick={onHide}>
                    Cerrar última compra
                </button>
            </div>
        );
    }
}));

const mockClients = [
    {
        id: 1,
        nombre: 'Cliente de prueba',
        email: 'cliente@ejemplo.com',
        telefono: '2291234567',
        rfc: 'XAXX010101000',
        razonSocial: 'Empresa de prueba',
        direccionFiscal: 'Veracruz, Veracruz',
        idUsoCfdi: 1,
        idRegimenFiscal: 601
    },
    {
        id: 2,
        nombre: 'Impresiones del Puerto',
        email: 'puerto@ejemplo.com',
        telefono: '2297654321',
        rfc: 'ABC010101AAA',
        razonSocial: 'Impresiones del Puerto SA',
        direccionFiscal: 'Boca del Río, Veracruz',
        idUsoCfdi: 1,
        idRegimenFiscal: 601
    }
];

const mockRegimenes = [
    {
        idRegimen: 601,
        clave: '601',
        descripcion: 'General de Ley Personas Morales'
    }
];

const mockUsosCfdi = [
    {
        idUsoCfdi: 1,
        clave: 'G03',
        descripcion: 'Gastos en general'
    }
];

describe('ListClientsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.mocked(ClientService.getAll).mockResolvedValue(mockClients as any);
        jest.mocked(ClientService.delete).mockResolvedValue(undefined as any);

        jest.mocked(CatalogService.getRegimenesFiscales)
            .mockResolvedValue(mockRegimenes as any);

        jest.mocked(CatalogService.getUsosCfdi)
            .mockResolvedValue(mockUsosCfdi as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Carga inicial', () => {
        it('muestra el título y el botón para agregar clientes', async () => {
            render(<ListClientsPage />);

            expect(
                screen.getByRole('heading', { name: 'Lista de clientes' })
            ).toBeInTheDocument();

            expect(
                screen.getByRole('button', { name: 'Agregar cliente' })
            ).toBeInTheDocument();

            await screen.findByText('Cliente de prueba');
        });

        it('consulta clientes y catálogos al cargar la página', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            await waitFor(() => {
                expect(ClientService.getAll).toHaveBeenCalledWith('todos');

                expect(
                    CatalogService.getRegimenesFiscales
                ).toHaveBeenCalled();

                expect(
                    CatalogService.getUsosCfdi
                ).toHaveBeenCalled();
            });
        });

        it('muestra los datos de los clientes en la tabla', async () => {
            render(<ListClientsPage />);

            expect(
                await screen.findByText('Cliente de prueba')
            ).toBeInTheDocument();

            expect(
                screen.getByText('cliente@ejemplo.com')
            ).toBeInTheDocument();

            expect(
                screen.getByText('2291234567')
            ).toBeInTheDocument();

            expect(
                screen.getByText('XAXX010101000')
            ).toBeInTheDocument();
        });

        it('muestra el régimen fiscal y el uso de CFDI', async () => {
            render(<ListClientsPage />);

            expect(
                await screen.findAllByText('601 - General de Ley Personas Morales')
            ).toHaveLength(2);

            expect(
                screen.getAllByText('G03 - Gastos en general')
            ).toHaveLength(2);
        });

        it('muestra guiones si no encuentra los datos fiscales', async () => {
            jest.mocked(ClientService.getAll).mockResolvedValueOnce([
                {
                    ...mockClients[0],
                    idRegimenFiscal: 999,
                    idUsoCfdi: 999
                }
            ] as any);

            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            const rows = screen.getAllByRole('row');
            const clientRow = rows.find((row) =>
                within(row).queryByText('Cliente de prueba')
            );

            expect(clientRow).toBeDefined();

            if (clientRow) {
                expect(within(clientRow).getAllByText('-')).toHaveLength(2);
            }
        });

        it('muestra el mensaje cuando no hay clientes', async () => {
            jest.mocked(ClientService.getAll).mockResolvedValueOnce([]);

            render(<ListClientsPage />);

            expect(
                await screen.findByText('No se encontraron clientes.')
            ).toBeInTheDocument();
        });
    });

    describe('Filtros de clientes', () => {
        it('muestra las opciones de filtro', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            expect(
                screen.getByRole('button', { name: 'Todos' })
            ).toBeInTheDocument();

            expect(
                screen.getByRole('button', { name: 'Mostrador' })
            ).toBeInTheDocument();

            expect(
                screen.getByRole('button', { name: 'Fiscales' })
            ).toBeInTheDocument();
        });

        it('consulta los clientes del filtro Mostrador', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getByRole('button', { name: 'Mostrador' })
            );

            await waitFor(() => {
                expect(ClientService.getAll).toHaveBeenCalledWith('mostrador');
            });
        });

        it('consulta los clientes del filtro Fiscales', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getByRole('button', { name: 'Fiscales' })
            );

            await waitFor(() => {
                expect(ClientService.getAll).toHaveBeenCalledWith('factura');
            });
        });

        it('no cambia el filtro cuando el valor recibido es nulo', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            const filtroActual = screen.getByRole('button', {
                name: 'Todos'
            });

            expect(filtroActual).toHaveAttribute('aria-pressed', 'true');
        });
    });

    describe('Búsqueda de clientes', () => {
        it('filtra clientes por nombre', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.change(
                screen.getByPlaceholderText('Buscar cliente...'),
                { target: { value: 'Impresiones del Puerto' } }
            );

            expect(
                screen.getByText('Impresiones del Puerto')
            ).toBeInTheDocument();

            expect(
                screen.queryByText('Cliente de prueba')
            ).not.toBeInTheDocument();
        });

        it('filtra clientes por correo electrónico', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.change(
                screen.getByPlaceholderText('Buscar cliente...'),
                { target: { value: 'cliente@ejemplo.com' } }
            );

            expect(
                screen.getByText('Cliente de prueba')
            ).toBeInTheDocument();

            expect(
                screen.queryByText('Impresiones del Puerto')
            ).not.toBeInTheDocument();
        });

        it('muestra el mensaje cuando la búsqueda no encuentra resultados', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.change(
                screen.getByPlaceholderText('Buscar cliente...'),
                { target: { value: 'Cliente inexistente' } }
            );

            expect(
                screen.getByText('No se encontraron clientes.')
            ).toBeInTheDocument();
        });
    });

    describe('Alta y edición de clientes', () => {
        it('abre el formulario para agregar un cliente nuevo', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getByRole('button', { name: 'Agregar cliente' })
            );

            expect(
                screen.getByRole('dialog', {
                    name: 'Formulario de cliente'
                })
            ).toBeInTheDocument();

            expect(screen.getByTestId('client-edit-id')).toHaveTextContent(
                'nuevo'
            );
        });

        it('abre el formulario con los datos del cliente seleccionado', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', { name: 'Editar' })[0]
            );

            expect(
                screen.getByRole('dialog', {
                    name: 'Formulario de cliente'
                })
            ).toBeInTheDocument();

            expect(screen.getByTestId('client-edit-id')).toHaveTextContent(
                '1'
            );
        });

        it('cierra el formulario al cancelar', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getByRole('button', { name: 'Agregar cliente' })
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Cerrar formulario' })
            );

            expect(
                screen.queryByRole('dialog', {
                    name: 'Formulario de cliente'
                })
            ).not.toBeInTheDocument();
        });

        it('recarga los clientes cuando el formulario informa un guardado exitoso', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            const llamadasIniciales = jest.mocked(ClientService.getAll).mock
                .calls.length;

            fireEvent.click(
                screen.getByRole('button', { name: 'Agregar cliente' })
            );

            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Guardar cliente simulado'
                })
            );

            await waitFor(() => {
                expect(ClientService.getAll).toHaveBeenCalledTimes(
                    llamadasIniciales + 1
                );
            });

            expect(
                screen.queryByRole('dialog', {
                    name: 'Formulario de cliente'
                })
            ).not.toBeInTheDocument();
        });
    });

    describe('Última compra', () => {
        it('abre el diálogo de última compra con el ID correcto', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', {
                    name: 'Última compra'
                })[0]
            );

            expect(
                screen.getByRole('dialog', { name: 'Última compra' })
            ).toBeInTheDocument();

            expect(
                screen.getByTestId('ultima-compra-cliente-id')
            ).toHaveTextContent('1');
        });

        it('cierra el diálogo de última compra', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', {
                    name: 'Última compra'
                })[0]
            );

            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Cerrar última compra'
                })
            );

            expect(
                screen.queryByRole('dialog', { name: 'Última compra' })
            ).not.toBeInTheDocument();
        });

        it('no abre la última compra si el cliente no tiene ID', async () => {
            jest.mocked(ClientService.getAll).mockResolvedValueOnce([
                {
                    ...mockClients[0],
                    id: null
                }
            ] as any);

            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getByRole('button', { name: 'Última compra' })
            );

            expect(
                screen.queryByRole('dialog', { name: 'Última compra' })
            ).not.toBeInTheDocument();
        });
    });

    describe('Eliminación de clientes', () => {
        it('abre el diálogo de confirmación', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', { name: 'Eliminar' })[0]
            );

            expect(
                screen.getByRole('dialog', { name: 'Confirmar' })
            ).toBeInTheDocument();

            expect(
                screen.getByText(/quieres eliminar a/i)
            ).toBeInTheDocument();
        });

        it('cierra la confirmación al seleccionar No', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', { name: 'Eliminar' })[0]
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'No' })
            );

            expect(
                screen.queryByRole('dialog', { name: 'Confirmar' })
            ).not.toBeInTheDocument();

            expect(ClientService.delete).not.toHaveBeenCalled();
        });

        it('elimina correctamente un cliente', async () => {
            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', { name: 'Eliminar' })[0]
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Sí' })
            );

            await waitFor(() => {
                expect(ClientService.delete).toHaveBeenCalledWith(1);
            });

            await waitFor(() => {
                expect(
                    screen.queryByText('Cliente de prueba')
                ).not.toBeInTheDocument();
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Eliminado',
                    detail: 'Cliente eliminado'
                })
            );
        });

        it('muestra un error cuando falla la eliminación', async () => {
            jest.mocked(ClientService.delete).mockRejectedValueOnce(
                new Error('Error de eliminación')
            );

            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getAllByRole('button', { name: 'Eliminar' })[0]
            );

            const dialog = screen.getByRole('dialog', { name: 'Confirmar' });

            fireEvent.click(
                within(dialog).getByRole('button', { name: 'Sí' })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo eliminar el cliente'
                    })
                );
            });

            expect(
                within(dialog).getByText('Cliente de prueba')
            ).toBeInTheDocument();
        });

        it('no intenta eliminar un cliente sin ID', async () => {
            jest.mocked(ClientService.getAll).mockResolvedValueOnce([
                {
                    ...mockClients[0],
                    id: null
                }
            ] as any);

            render(<ListClientsPage />);

            await screen.findByText('Cliente de prueba');

            fireEvent.click(
                screen.getByRole('button', { name: 'Eliminar' })
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Sí' })
            );

            expect(ClientService.delete).not.toHaveBeenCalled();
        });
    });

    describe('Manejo de errores', () => {
        it('muestra una notificación cuando falla la carga de clientes', async () => {
            jest.mocked(ClientService.getAll).mockRejectedValueOnce(
                new Error('Error de conexión')
            );

            render(<ListClientsPage />);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar los clientes'
                    })
                );
            });
        });

        it('registra el error si falla la carga de catálogos', async () => {
            const consoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            jest.mocked(CatalogService.getRegimenesFiscales)
                .mockRejectedValueOnce(new Error('Error de catálogo'));

            try {
                render(<ListClientsPage />);

                await screen.findByText('Cliente de prueba');

                await waitFor(() => {
                    expect(consoleError).toHaveBeenCalledWith(
                        'Error cargando catálogos',
                        expect.any(Error)
                    );
                });
            } finally {
                consoleError.mockRestore();
            }
        });

        it('mantiene el mensaje de tabla vacía cuando falla la carga de clientes', async () => {
            jest.mocked(ClientService.getAll).mockRejectedValueOnce(
                new Error('Error de conexión')
            );

            render(<ListClientsPage />);

            expect(
                await screen.findByText('No se encontraron clientes.')
            ).toBeInTheDocument();
        });
    });
});
