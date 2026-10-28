import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SuppliesVerificationPage from './page';
import { OrderService } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';
import { ClientService } from '@/app/service/clientService';

const mockPush = jest.fn();
const mockGet = jest.fn(() => '123');

jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: mockGet,
    }),
    useRouter: () => ({
        push: mockPush,
    }),
}));

jest.mock('next/link', () => {
    return function MockLink({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) {
        return <a href={href}>{children}</a>;
    };
});

jest.mock('primereact/button', () => ({
    Button: ({
        label,
        children,
        onClick,
        disabled,
        type,
    }: {
        label?: string;
        children?: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        type?: string;
    }) => (
        <button
            type={(type as 'button' | 'submit' | 'reset') || 'button'}
            disabled={disabled}
            onClick={onClick}
        >
            {label ?? children}
        </button>
    ),
}));

jest.mock('primereact/card', () => ({
    Card: ({
        title,
        children,
    }: {
        title?: string;
        children?: React.ReactNode;
    }) => (
        <section>
            {title && <h2>{title}</h2>}
            {children}
        </section>
    ),
}));

jest.mock('primereact/inputtext', () => ({
    InputText: ({
        value,
        onChange,
        disabled,
        placeholder,
    }: {
        value?: string;
        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
        disabled?: boolean;
        placeholder?: string;
    }) => (
        <input
            aria-label="Cantidad a pedir"
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
        />
    ),
}));

jest.mock('primereact/inputtextarea', () => ({
    InputTextarea: ({
        id,
        value,
        onChange,
        placeholder,
    }: {
        id?: string;
        value?: string;
        onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
        placeholder?: string;
    }) => (
        <textarea
            id={id}
            aria-label="Notas para compras"
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
        />
    ),
}));

jest.mock('primereact/toast', () => {
    const React = require('react');

    const MockToast = React.forwardRef(
        (_props: unknown, ref: React.Ref<{ show: jest.Mock }>) => {
            React.useImperativeHandle(ref, () => ({
                show: jest.fn(),
            }));

            return <div data-testid="toast" />;
        },
    );

    MockToast.displayName = 'MockToast';

    return {
        Toast: MockToast,
    };
});

jest.mock('primereact/datatable', () => ({
    DataTable: ({
        value = [],
        selection = [],
        onSelectionChange,
        children,
    }: {
        value?: any[];
        selection?: any[];
        onSelectionChange?: (event: { value: any[] }) => void;
        children?: React.ReactNode;
    }) => {
        const columns = React.Children.toArray(children) as React.ReactElement[];

        return (
            <div data-testid="mock-datatable">
                {value.map((row) => {
                    const isSelected = selection.some(
                        (selected) => selected.idDetalle === row.idDetalle,
                    );

                    return (
                        <div key={row.idDetalle} data-testid={`row-${row.idDetalle}`}>
                            {columns.map((column, index) => {
                                const props = column.props as {
                                    field?: string;
                                    header?: string;
                                    body?: (data: any) => React.ReactNode;
                                    selectionMode?: string;
                                };

                                if (props.selectionMode === 'multiple') {
                                    return (
                                        <button
                                            key={`selection-${index}`}
                                            type="button"
                                            aria-label={`Seleccionar ${row.nombreProducto}`}
                                            onClick={() => {
                                                const nextSelection = isSelected
                                                    ? selection.filter(
                                                        (item) =>
                                                            item.idDetalle !== row.idDetalle,
                                                    )
                                                    : [...selection, row];

                                                onSelectionChange?.({
                                                    value: nextSelection,
                                                });
                                            }}
                                        >
                                            {isSelected ? 'Seleccionado' : 'Seleccionar'}
                                        </button>
                                    );
                                }

                                if (props.body) {
                                    return (
                                        <div key={`body-${index}`}>
                                            {props.body(row)}
                                        </div>
                                    );
                                }

                                if (props.field) {
                                    return (
                                        <span key={`field-${index}`}>
                                            {row[props.field]}
                                        </span>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    );
                })}
            </div>
        );
    },
}));

jest.mock('primereact/column', () => ({
    Column: () => null,
}));

jest.mock('primereact/dialog', () => ({
    Dialog: ({
        visible,
        header,
        footer,
        children,
    }: {
        visible?: boolean;
        header?: React.ReactNode;
        footer?: React.ReactNode;
        children?: React.ReactNode;
    }) => {
        if (!visible) return null;

        return (
            <div role="dialog" aria-label="Solicitar insumos">
                {header}
                {children}
                {footer}
            </div>
        );
    },
}));

const mockOrder = {
    idOrden: 123,
    idCliente: 10,
    montoTotal: 2500,
    fechaEntregaFormal: '2026-10-30',
    detalles: [
        {
            idDetalle: 1,
            idProducto: 50,
            cantidad: 1200,
        },
        {
            idDetalle: 2,
            idProducto: 51,
            cantidad: 4,
        },
    ],
};

const mockProducts = [
    {
        idProducto: 50,
        descripcion: 'Tarjetas de presentación',
        unidadVenta: 'pzas',
        cantidadPaquete: 500,
        precioPaquete: 350,
    },
    {
        idProducto: 51,
        descripcion: 'Lona impresa',
        unidadVenta: 'm²',
        cantidadPaquete: 1,
        precioPaquete: 0,
    },
];

const mockClient = {
    idCliente: 10,
    nombre: 'Cliente de prueba',
};

describe('SuppliesVerificationPage', () => {
    let getOrdenSpy: jest.SpyInstance;
    let getProductsSpy: jest.SpyInstance;
    let getClientSpy: jest.SpyInstance;
    let avanzarEstatusSpy: jest.SpyInstance;
    let crearSolicitudCompraSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        localStorage.clear();
        localStorage.setItem(
            'user',
            JSON.stringify({
                idUsuario: 7,
            }),
        );

        mockGet.mockReturnValue('123');

        getOrdenSpy = jest
            .spyOn(OrderService, 'getOrdenById')
            .mockResolvedValue(mockOrder as any);

        getProductsSpy = jest
            .spyOn(CatalogService, 'getAllProductos')
            .mockResolvedValue(mockProducts as any);

        getClientSpy = jest
            .spyOn(ClientService, 'getById')
            .mockResolvedValue(mockClient as any);

        avanzarEstatusSpy = jest
            .spyOn(OrderService, 'avanzarEstatus')
            .mockResolvedValue(undefined as any);

        crearSolicitudCompraSpy = jest
            .spyOn(OrderService, 'crearSolicitudCompra')
            .mockResolvedValue(undefined as any);

        consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    const renderPage = async () => {
        render(<SuppliesVerificationPage />);

        await waitFor(() => {
            expect(
                screen.getByText('Verificación de insumos orden #123'),
            ).toBeInTheDocument();
        });
    };

    it('consulta la orden, los productos y el cliente, y muestra los datos', async () => {
        await renderPage();

        expect(getOrdenSpy).toHaveBeenCalledWith(123);
        expect(getProductsSpy).toHaveBeenCalledTimes(1);
        expect(getClientSpy).toHaveBeenCalledWith(10);

        expect(screen.getByText('Cliente de prueba')).toBeInTheDocument();
        expect(screen.getByText('Tarjetas de presentación')).toBeInTheDocument();
        expect(screen.getByText('Lona impresa')).toBeInTheDocument();
    });

    it('usa Cliente Mostrador cuando la orden no tiene idCliente', async () => {
        getOrdenSpy.mockResolvedValueOnce({
            ...mockOrder,
            idCliente: null,
        } as any);

        await renderPage();

        expect(screen.getByText('Cliente Mostrador')).toBeInTheDocument();
        expect(getClientSpy).not.toHaveBeenCalled();
    });

    it('registra el error del cliente y conserva Cliente Mostrador si falla su consulta', async () => {
        getClientSpy.mockRejectedValueOnce(new Error('Error al consultar cliente'));

        await renderPage();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error cliente',
            expect.any(Error),
        );

        expect(screen.getByText('Cliente Mostrador')).toBeInTheDocument();
    });

    it('muestra el mensaje de orden no encontrada si falla la carga principal', async () => {
        getOrdenSpy.mockRejectedValueOnce(new Error('Error de API'));

        render(<SuppliesVerificationPage />);

        expect(
            await screen.findByText('No se encontró la orden.'),
        ).toBeInTheDocument();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error cargando datos',
            expect.any(Error),
        );
    });

    it('muestra la orden sin cliente y sin fecha de entrega definida', async () => {
        getOrdenSpy.mockResolvedValueOnce({
            ...mockOrder,
            idCliente: null,
            fechaEntregaFormal: null,
        } as any);

        await renderPage();

        expect(screen.getByText('No definida')).toBeInTheDocument();
    });

    it('avanza el estatus al confirmar que los insumos están completos', async () => {
        await renderPage();

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar existencia/i }),
        );

        await waitFor(() => {
            expect(avanzarEstatusSpy).toHaveBeenCalledWith(123, {
                idUsuario: 7,
                idEstatusDestino: 3,
                hayInsumos: true,
                clienteAprobo: false,
            });
        });
    });

    it('usa idUsuario 1 si no existe información del usuario en localStorage', async () => {
        localStorage.removeItem('user');

        await renderPage();

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar existencia/i }),
        );

        await waitFor(() => {
            expect(avanzarEstatusSpy).toHaveBeenCalledWith(123, {
                idUsuario: 1,
                idEstatusDestino: 3,
                hayInsumos: true,
                clienteAprobo: false,
            });
        });
    });

    it('maneja un error al confirmar insumos y registra el mensaje', async () => {
        avanzarEstatusSpy.mockRejectedValueOnce(
            new Error('No se pudo actualizar el estatus'),
        );

        await renderPage();

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar existencia/i }),
        );

        await waitFor(() => {
            expect(avanzarEstatusSpy).toHaveBeenCalled();
        });

        expect(avanzarEstatusSpy).toHaveBeenCalledWith(
            123,
            expect.objectContaining({
                idEstatusDestino: 3,
                hayInsumos: true,
            }),
        );
    });

    it('abre el diálogo al indicar que falta material', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        expect(
            await screen.findByRole('dialog', { name: 'Solicitar insumos' }),
        ).toBeInTheDocument();

        expect(screen.getByText(/Selecciona los productos/i)).toBeInTheDocument();
    });

    it('permite cerrar el diálogo con Cancelar', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        expect(
            await screen.findByRole('dialog', { name: 'Solicitar insumos' }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog', { name: 'Solicitar insumos' }),
            ).not.toBeInTheDocument();
        });
    });

    it('sugiere paquetes redondeando hacia arriba para productos empaquetados', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Tarjetas de presentación',
            }),
        );

        const quantityInputs = screen.getAllByRole('textbox', {
            name: 'Cantidad a pedir',
        });

        expect(quantityInputs[0]).toHaveValue('3 Paquetes');
        expect(quantityInputs[0]).toBeEnabled();
    });

    it('sugiere la cantidad directa para un producto unitario', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Lona impresa',
            }),
        );

        const inputs = screen.getAllByRole('textbox', {
            name: 'Cantidad a pedir',
        });

        expect(inputs[1]).toHaveValue('4');
        expect(inputs[1]).toBeEnabled();
    });

    it('deshabilita el campo de cantidad para una fila no seleccionada', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        const inputs = screen.getAllByRole('textbox', {
            name: 'Cantidad a pedir',
        });

        expect(inputs[0]).toBeDisabled();
        expect(inputs[1]).toBeDisabled();
    });

    it('permite editar manualmente la cantidad solicitada y las notas', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Tarjetas de presentación',
            }),
        );

        const quantityInputs = screen.getAllByRole('textbox', {
            name: 'Cantidad a pedir',
        });

        fireEvent.change(quantityInputs[0], {
            target: { value: '5 paquetes' },
        });

        fireEvent.change(
            screen.getByRole('textbox', { name: 'Notas para compras' }),
            {
                target: { value: 'Compra urgente' },
            },
        );

        expect(quantityInputs[0]).toHaveValue('5 paquetes');

        expect(
            screen.getByRole('textbox', { name: 'Notas para compras' }),
        ).toHaveValue('Compra urgente');
    });

    it('no permite enviar la solicitud si no se seleccionó ningún producto', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        expect(
            screen.getByRole('button', { name: /Enviar Solicitud/i }),
        ).toBeDisabled();

        expect(crearSolicitudCompraSpy).not.toHaveBeenCalled();
    });

    it('crea la solicitud de compra y avanza el estatus a espera de insumos', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Tarjetas de presentación',
            }),
        );

        fireEvent.change(
            screen.getByRole('textbox', { name: 'Notas para compras' }),
            {
                target: {
                    value: 'Proveedor sugerido: Papelería ABC',
                },
            },
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Enviar Solicitud/i }),
        );

        await waitFor(() => {
            expect(crearSolicitudCompraSpy).toHaveBeenCalledWith({
                idUsuario: 7,
                idOrden: 123,
                descripcionGeneral: 'Proveedor sugerido: Papelería ABC',
                productos: [
                    {
                        idProducto: 50,
                        cantidad: '3 Paquetes',
                    },
                ],
            });
        });

        expect(avanzarEstatusSpy).toHaveBeenLastCalledWith(123, {
            idUsuario: 7,
            idEstatusDestino: 4,
            hayInsumos: false,
        });
    });

    it('usa la descripción predeterminada si no se escriben notas', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Lona impresa',
            }),
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Enviar Solicitud/i }),
        );

        await waitFor(() => {
            expect(crearSolicitudCompraSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    descripcionGeneral: 'Solicitud de insumos',
                    productos: [
                        {
                            idProducto: 51,
                            cantidad: '4',
                        },
                    ],
                }),
            );
        });
    });

    it('maneja un error al crear la solicitud de compra', async () => {
        crearSolicitudCompraSpy.mockRejectedValueOnce(
            new Error('No se pudo crear la solicitud'),
        );

        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Tarjetas de presentación',
            }),
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Enviar Solicitud/i }),
        );

        await waitFor(() => {
            expect(crearSolicitudCompraSpy).toHaveBeenCalled();
        });

        expect(avanzarEstatusSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error payload:',
            expect.any(Error),
        );
    });

    it('maneja un error al avanzar el estatus después de crear la solicitud', async () => {
        avanzarEstatusSpy.mockRejectedValueOnce(
            new Error('No se pudo avanzar el estatus'),
        );

        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Falta material/i }));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar Tarjetas de presentación',
            }),
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Enviar Solicitud/i }),
        );

        await waitFor(() => {
            expect(crearSolicitudCompraSpy).toHaveBeenCalled();
            expect(avanzarEstatusSpy).toHaveBeenCalled();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error payload:',
            expect.any(Error),
        );
    });
});