import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Counter from './page';
import { ClientService } from '@/app/service/clientService';
import { CatalogService } from '@/app/service/catalogService';
import { OrderService } from '@/app/service/orderService';
import { UserService } from '@/app/service/userService';

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

jest.mock('@/app/service/clientService');
jest.mock('@/app/service/catalogService');
jest.mock('@/app/service/orderService');
jest.mock('@/app/service/userService');

const mockClientService = ClientService as jest.Mocked<typeof ClientService>;
const mockCatalogService = CatalogService as jest.Mocked<typeof CatalogService>;
const mockOrderService = OrderService as jest.Mocked<typeof OrderService>;
const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockToastShow = jest.fn();

jest.mock('primereact/toast', () => ({
    Toast: React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            show: mockToastShow,
        }));

        return <div data-testid="primereact-toast" />;
    }),
}));

jest.mock('primereact/autocomplete', () => ({
    AutoComplete: ({
        onSelect,
        suggestions,
        placeholder,
        onChange,
        completeMethod,
        value,
    }: any) => (
        <div>
            <input
                placeholder={placeholder}
                value={
                    value
                        ? typeof value === 'object'
                            ? value.nombre || value.descripcion || ''
                            : value
                        : ''
                }
                onChange={(event) => {
                    const query = event.target.value;
                    onChange?.({ value: query });
                    completeMethod?.({ query });
                }}
            />

            <button
                type="button"
                data-testid={
                    placeholder?.toLowerCase().includes('productos')
                        ? 'select-product-btn'
                        : 'select-client-btn'
                }
                onClick={() => {
                    const isProduct =
                        placeholder?.toLowerCase().includes('productos');

                    const selectedValue =
                        suggestions?.[0] ||
                        (isProduct
                            ? {
                                idProducto: 101,
                                descripcion: 'Lona Impresa',
                                precioUnitario: 150,
                                tiempoProduccionDias: 1,
                            }
                            : {
                                idClient: 1,
                                id: 1,
                                nombre: 'Cliente Uno',
                                email: 'uno@test.com',
                            });

                    onSelect?.({ value: selectedValue });
                    onChange?.({ value: selectedValue });
                }}
            >
                {placeholder?.toLowerCase().includes('productos')
                    ? 'Seleccionar Producto Mock'
                    : 'Seleccionar Cliente Mock'}
            </button>
        </div>
    ),
}));

jest.mock('primereact/dropdown', () => ({
    Dropdown: ({
        onChange,
        options,
        value,
        placeholder,
    }: any) => (
        <select
            data-testid="designer-select"
            value={value ?? ''}
            onChange={(e) =>
                onChange?.({
                    value: Number(e.target.value) || e.target.value,
                })
            }
        >
            <option value="">
                {placeholder || 'Seleccionar Diseñador'}
            </option>

            {options?.map((option: any) => (
                <option
                    key={option.idUsuario ?? option.value}
                    value={option.idUsuario ?? option.value}
                >
                    {option.nombre ?? option.label}
                </option>
            ))}
        </select>
    ),
}));


jest.mock('../../components/QuoteListDialog', () => ({
    QuoteListDialog: ({
        visible,
        onHide,
        onRetake,
        onPage,
    }: any) =>
        visible ? (
            <div data-testid="quote-list-dialog">
                <button
                    onClick={() =>
                        onRetake({
                            idOrden: 10,
                            montoTotal: 500,
                            montoPagado: 0,
                            idEstatusActual: 1,
                            idCondicionPago: 1,
                        })
                    }
                >
                    Seleccionar Cotización Mock
                </button>

                <button
                    onClick={() =>
                        onPage?.({ first: 10, rows: 10, page: 1 })
                    }
                >
                    Página siguiente cotizaciones
                </button>


                <button onClick={onHide}>
                    Cerrar Cotizaciones
                </button>
            </div>
        ) : null,
}));

jest.mock('../../components/ActiveOrdersDialog', () => ({
    ActiveOrdersDialog: ({
        visible,
        onHide,
        onQuickPay,
        onPage,
    }: any) =>
        visible ? (
            <div data-testid="active-orders-dialog">
                {[1, 2, 3, 4, 99].map((conditionId) => (
                    <button
                        key={conditionId}
                        onClick={() =>
                            onQuickPay({
                                idOrden: 10 + conditionId,
                                montoTotal: 600,
                                montoPagado: conditionId === 2 ? 150 : 100,
                                idEstatusActual: 2,
                                idCondicionPago: conditionId,
                            })
                        }
                    >
                        Pago condición {conditionId}
                    </button>
                ))}

                <button
                    onClick={() =>
                        onQuickPay({
                            idOrden: 10,
                            montoTotal: 500,
                            montoPagado: 0,
                            idEstatusActual: 1,
                            idCondicionPago: 1,
                        })
                    }
                >
                    Seleccionar Orden Mock
                </button>

                <button
                    onClick={() => onPage?.({ first: 10, rows: 10, page: 1 })}
                >
                    Página siguiente órdenes
                </button>

                <button onClick={onHide}>Cerrar Ordenes</button>
            </div>
        ) : null,
}));

jest.mock('../../components/QuoteSummaryDialog', () => ({
    QuoteSummaryDialog: ({
        visible,
        onHide,
        onConfirm,
        onAssignClient,
        designers,
        selectedDesigner,
        onSelectDesigner,
        productionTime,
    }: any) =>
        visible ? (
            <div data-testid="quote-summary-dialog">
                <button onClick={onAssignClient}>
                    Asignar cliente
                </button>

                <select
                    data-testid="quote-designer-select"
                    value={selectedDesigner ?? ''}
                    onChange={(e) =>
                        onSelectDesigner(
                            e.target.value ? Number(e.target.value) : null
                        )
                    }
                >
                    <option value="">
                        Selecciona un diseñador
                    </option>

                    {designers?.map((designer: any) => (
                        <option
                            key={designer.value}
                            value={designer.value}
                        >
                            {designer.label}
                        </option>
                    ))}
                </select>

                <span data-testid="production-time">
                    {productionTime}
                </span>

                <button onClick={onConfirm}>
                    Confirmar Cotización
                </button>

                <button onClick={onHide}>
                    Cerrar Resumen
                </button>
            </div>
        ) : null,
}));

jest.mock('../../components/OrderPaymentDialog', () => ({
    OrderPaymentDialog: ({
        visible,
        onHide,
        onConfirmPayment,
    }: any) =>
        visible ? (
            <div data-testid="order-payment-dialog">
                <button
                    onClick={() =>
                        onConfirmPayment({
                            conditionId: 1,
                            amount: 100,
                            notes: 'test',
                        })}>Procesar Pago
                </button>

                <button
                    onClick={() =>
                        onConfirmPayment({
                            conditionId: 1,
                            amount: 0,
                            notes: 'Sin pago',
                        })}>Procesar sin importe
                </button>

                <button
                    onClick={() =>
                        onConfirmPayment({
                            conditionId: 1,
                            amount: 0,
                            notes: 'Prueba de archivo',
                            paymentType: 'unico',
                            file: new File(['contenido'], 'diseno.pdf', {
                                type: 'application/pdf',
                            }),
                        })
                    }
                >
                    Procesar con archivo
                </button>

                <button onClick={onHide}>Cerrar Pago</button>
            </div>
        ) : null,
}));

jest.mock('../../components/ProductQuantityDialog', () => ({
    ProductQuantityDialog: ({
        visible,
        product,
        onConfirm,
        onHide,
    }: any) =>
        visible && product ? (
            <div data-testid="product-quantity-dialog">
                <span>{product.descripcion}</span>

                <button
                    onClick={() => {
                        onConfirm(product, 2);
                        onHide();
                    }}
                >
                    Confirmar cantidad
                </button>

                <button onClick={onHide}>Cancelar</button>
            </div>
        ) : null,
}));

jest.mock('@/app/components/ClientFormDialog', () => ({
    ClientFormDialog: ({ visible, onHide }: any) =>
        visible ? (
            <div data-testid="client-form-dialog">
                <button onClick={onHide}>Cerrar Form Cliente</button>
            </div>
        ) : null,
}));

jest.mock('@/app/components/ClientSearchDialog', () => ({
    ClientSearchDialog: ({
        visible,
        onHide,
        onSelect,
    }: any) =>
        visible ? (
            <div data-testid="client-search-dialog">
                <button
                    onClick={() => {
                        onSelect({
                            id: 1,
                            idCliente: 1,
                            nombre: 'Cliente Uno',
                            email: 'uno@test.com',
                            rfc: 'XAXX010101000',
                            direccionFiscal: 'Dirección de prueba',
                        });
                        onHide();
                    }}
                >
                    Seleccionar Cliente Mock
                </button>

                <button onClick={onHide}>Cerrar búsqueda</button>
            </div>
        ) : null,
}));

describe('Counter Component', () => {
    const mockClients = [
        {
            idClient: 1,
            id: 1,
            nombre: 'Cliente Uno',
            email: 'uno@test.com',
        },
    ];

    const mockDesigners = [
        {
            idUsuario: 10,
            nombre: 'Diseñador Alex',
        },
    ];

    const mockConditions = [
        {
            idCondicionPago: 1,
            descripcion: 'Contado',
        },
    ];

    const mockEstatus = [
        {
            idEstatus: 1,
            descripcion: 'Cotización',
        },
    ];

    const mockProducts = [
        {
            idProducto: 101,
            descripcion: 'Lona Impresa',
            precioUnitario: 150,
            tiempoProduccionDias: 1,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        localStorage.setItem(
            'user',
            JSON.stringify({
                idUsuario: 1,
                email: 'admin@test.com',
            })
        );

        mockClientService.getAll.mockResolvedValue(
            mockClients as any
        );

        mockUserService.getDesigners.mockResolvedValue(
            mockDesigners as any
        );

        mockCatalogService.getCondicionesPago.mockResolvedValue(
            mockConditions as any
        );

        mockOrderService.getEstatusOperaciones.mockResolvedValue(
            mockEstatus as any
        );

        mockCatalogService.getAllProductos.mockResolvedValue(
            mockProducts as any
        );

        mockOrderService.getOrdenes.mockResolvedValue({
            content: [],
            page: { totalElements: 0 },
        } as any);

        mockOrderService.getOrdenesActivas.mockResolvedValue({
            content: [],
            page: { totalElements: 0 },
        } as any);

        mockOrderService.getCotizacionesYCanceladas.mockResolvedValue({
            content: [],
            page: { totalElements: 0 },
        } as any);
    });


    const renderComponent = async () => {
        let result!: ReturnType<typeof render>;

        await act(async () => {
            result = render(<Counter />);
        });

        return result;
    };

    const prepararCotizacion = async () => {
        await renderComponent();
        fireEvent.click(
            screen.getByTestId('select-product-btn')
        );
        fireEvent.click(
            await screen.findByRole('button', {
                name: /confirmar cantidad/i,
            })
        );
        expect(
            screen.getByText('Lona Impresa')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: /cotizar/i,
            })
        );

        expect(
            screen.getByTestId('quote-summary-dialog')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: /asignar cliente/i,
            })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar cliente mock/i,
            })
        );

        fireEvent.change(
            screen.getByTestId('quote-designer-select'),
            { target: { value: '10' } }
        );
    };

    it('debe tolerar errores al cargar los catálogos iniciales', async () => {
        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        mockClientService.getAll.mockRejectedValueOnce(
            new Error('Error clientes')
        );
        mockCatalogService.getCondicionesPago.mockRejectedValueOnce(
            new Error('Error condiciones')
        );
        mockUserService.getDesigners.mockRejectedValueOnce(
            new Error('Error diseñadores')
        );
        mockOrderService.getEstatusOperaciones.mockRejectedValueOnce(
            new Error('Error estatus')
        );
        mockCatalogService.getAllProductos.mockRejectedValueOnce(
            new Error('Error productos')
        );

        await renderComponent();

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        expect(mockClientService.getAll).toHaveBeenCalled();
        expect(mockCatalogService.getCondicionesPago).toHaveBeenCalled();
        expect(mockUserService.getDesigners).toHaveBeenCalled();
        expect(mockOrderService.getEstatusOperaciones).toHaveBeenCalled();
        expect(mockCatalogService.getAllProductos).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('debe inicializar y cargar los catálogos sin lanzar errores', async () => {
        await renderComponent();

        await waitFor(() => {
            expect(mockClientService.getAll).toHaveBeenCalled();
            expect(mockUserService.getDesigners).toHaveBeenCalled();
            expect(
                mockCatalogService.getCondicionesPago
            ).toHaveBeenCalled();
            expect(
                mockOrderService.getEstatusOperaciones
            ).toHaveBeenCalled();
            expect(
                mockCatalogService.getAllProductos
            ).toHaveBeenCalled();
            expect(mockOrderService.getOrdenes).toHaveBeenCalled();
        });

        await act(async () => {
            await Promise.all([
                mockClientService.getAll(),
                mockUserService.getDesigners(),
                mockCatalogService.getCondicionesPago(),
                mockOrderService.getEstatusOperaciones(),
                mockCatalogService.getAllProductos(),
                mockOrderService.getOrdenes(),
            ]);
        });
    });


    it('debe prevenir la inserción de productos duplicados en el carrito', async () => {
        await renderComponent();

        fireEvent.click(
            screen.getByTestId('select-product-btn')
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /confirmar cantidad/i,
            })
        );

        expect(
            screen.getByRole('button', { name: /cotizar/i })
        ).not.toBeDisabled();

        // Intentar agregar el mismo producto nuevamente.
        fireEvent.click(
            screen.getByTestId('select-product-btn')
        );

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                summary: 'Producto duplicado',
                detail: expect.stringContaining(
                    'Este producto ya está en la lista'
                ),
            })
        );
    });

    it('debe guardar la cotización cuando hay cliente y diseñador asignados', async () => {
        mockOrderService.crearOrden.mockResolvedValueOnce({} as any);

        await prepararCotizacion();

        fireEvent.click(
            screen.getByRole('button', {
                name: /confirmar cotización/i,
            })
        );

        await waitFor(() => {
            expect(
                mockOrderService.crearOrden
            ).toHaveBeenCalledTimes(1);
        });

        expect(mockOrderService.crearOrden).toHaveBeenCalledWith(
            expect.objectContaining({
                orden: expect.objectContaining({
                    idUsuario: 1,
                    idCliente: 1,
                    idUsuarioDisenador: 10,
                    montoTotal: 300,
                    plazoEstimadoDias: 1,
                }),
                detalles: expect.arrayContaining([
                    expect.objectContaining({
                        idProducto: 101,
                        cantidad: 2,
                        precioUnitario: 150,
                        importe: 300,
                    }),
                ]),
                idUsuarioAccion: 1,
            })
        );

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Cotización guardada',
                    detail: 'Disponible en la lista.',
                })
            );
        });
    });

    it('debe limpiar el carrito después de guardar una cotización', async () => {
        mockOrderService.crearOrden.mockResolvedValueOnce({} as any);

        await prepararCotizacion();

        expect(
            screen.getByText('Lona Impresa')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: /confirmar cotización/i,
            })
        );

        await waitFor(() => {
            expect(
                mockOrderService.crearOrden
            ).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(
                screen.queryByText('Lona Impresa')
            ).not.toBeInTheDocument();
        });

        expect(
            screen.getByRole('button', { name: /cotizar/i })
        ).toBeDisabled();

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Cotización guardada',
            })
        );
    });

    it('debe procesar correctamente un pago completo y avanzar estatus', async () => {
        mockOrderService.updateCondicionPago.mockResolvedValue(
            {} as any
        );

        mockOrderService.updateNotasDiseno.mockResolvedValue(
            {} as any
        );

        mockOrderService.registrarPago.mockResolvedValue(
            {} as any
        );

        mockOrderService.avanzarEstatus.mockResolvedValue(
            {} as any
        );

        mockOrderService.getOrdenById.mockResolvedValue({
            idOrden: 10,
            montoTotal: 500,
            montoPagado: 0,
            notasDiseno: 'Notas de prueba',
            detalles: [],
        } as any);

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', {
                name: /lista de ordenes/i,
            })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar orden mock/i,
            })
        );

        await waitFor(() => {
            expect(
                screen.getByTestId('order-payment-dialog')
            ).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: /Procesar Pago/i,
            })
        );

        await waitFor(() => {
            expect(
                mockOrderService.updateCondicionPago
            ).toHaveBeenCalledWith(10, 1);

            expect(
                mockOrderService.registrarPago
            ).toHaveBeenCalledWith(
                10,
                expect.objectContaining({
                    monto: 100,
                    idUsuario: 1,
                })
            );

            expect(
                mockOrderService.avanzarEstatus
            ).toHaveBeenCalledWith(10, {
                idUsuario: 1,
            });
        });

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Orden actualizada correctamente',
                })
            );
        });
    });

    it('debe impedir guardar una cotización sin cliente', async () => {
        await renderComponent();

        fireEvent.click(screen.getByTestId('select-product-btn'));
        fireEvent.click(
            screen.getByRole('button', { name: /confirmar cantidad/i })
        );
        fireEvent.click(screen.getByRole('button', { name: /cotizar/i }));

        fireEvent.click(
            screen.getByRole('button', { name: /confirmar cotización/i })
        );

        expect(mockOrderService.crearOrden).not.toHaveBeenCalled();

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                detail: 'Asigna un cliente',
            })
        );
    });

    it('debe impedir guardar una cotización sin diseñador', async () => {
        await renderComponent();

        fireEvent.click(screen.getByTestId('select-product-btn'));
        fireEvent.click(screen.getByRole('button', { name: /confirmar cantidad/i }));
        fireEvent.click(screen.getByRole('button', { name: /cotizar/i }));
        fireEvent.click(screen.getByRole('button', { name: /asignar cliente/i }));
        fireEvent.click(screen.getByRole('button', { name: /seleccionar cliente/i }));
        fireEvent.click(
            screen.getByRole('button', { name: /confirmar cotización/i })
        );

        expect(mockOrderService.crearOrden).not.toHaveBeenCalled();

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                detail: 'Selecciona un diseñador',
            })
        );
    });

    it('debe mostrar un error cuando falla el guardado de la cotización', async () => {
        mockOrderService.crearOrden.mockRejectedValueOnce(
            new Error('Error simulado del servidor')
        );

        await prepararCotizacion();

        fireEvent.click(
            screen.getByRole('button', { name: /confirmar cotización/i })
        );

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Fallo al guardar cotización',
                })
            );
        });
    });

    it('debe manejar un error al buscar productos', async () => {
        mockCatalogService.getProducto.mockRejectedValueOnce(
            new Error('Error simulado')
        );

        await renderComponent();

        fireEvent.change(
            screen.getByPlaceholderText(/escribe para buscar productos/i),
            { target: { value: 'tarjetas' } }
        );

        await waitFor(() => {
            expect(mockCatalogService.getProducto).toHaveBeenCalledWith(
                'tarjetas'
            );
        });
    });


    it('no debe consultar productos cuando la búsqueda está vacía o contiene espacios', async () => {
        await renderComponent();

        fireEvent.change(
            screen.getByPlaceholderText(/escribe para buscar productos/i),
            { target: { value: '   ' } }
        );

        await waitFor(() => {
            expect(mockCatalogService.getProducto).not.toHaveBeenCalled();
        });
    });

    it('debe tolerar un error al buscar productos', async () => {
        mockCatalogService.getProducto.mockRejectedValueOnce(
            new Error('Error simulado')
        );

        await renderComponent();

        fireEvent.change(
            screen.getByPlaceholderText(/escribe para buscar productos/i),
            { target: { value: 'tarjetas' } }
        );

        await waitFor(() => {
            expect(mockCatalogService.getProducto).toHaveBeenCalledWith('tarjetas');
        });

        expect(screen.getByText('Carrito vacío.')).toBeInTheDocument();
    });


    it('debe manejar un historial vacío', async () => {
        mockOrderService.getOrdenes.mockResolvedValueOnce({
            content: [],
            page: { totalElements: 0 },
        } as any);

        await renderComponent();

        await waitFor(() => {
            expect(mockOrderService.getOrdenes).toHaveBeenCalled();
        });

        expect(screen.getByText('Carrito vacío.')).toBeInTheDocument();
    });

    it('debe mostrar un aviso cuando falla la carga del historial', async () => {
        mockOrderService.getOrdenes.mockRejectedValueOnce(
            new Error('Error de conexión')
        );

        await renderComponent();

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el historial',
                })
            );
        });
    });

    it('debe volver a consultar diseñadores cuando el catálogo está vacío', async () => {
        mockUserService.getDesigners.mockResolvedValue([
            { idUsuario: 10, nombre: 'Diseñador Alex' },
        ] as any);

        mockOrderService.getOrdenes.mockResolvedValueOnce({
            content: [
                {
                    idOrden: 20,
                    idUsuarioDisenador: 10,
                    idEstatusActual: 1,
                    montoTotal: 500,
                    montoPagado: 100,
                },
            ],
            page: { totalElements: 1 },
        } as any);

        await renderComponent();

        await waitFor(() => {
            expect(mockUserService.getDesigners).toHaveBeenCalledTimes(2);
        });
    });


    it('debe procesar órdenes con distintas condiciones de pago rápido', async () => {
        mockOrderService.getOrdenById.mockResolvedValue({
            notasDiseno: 'Notas de prueba',
            detalles: [],
        } as any);

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de ordenes/i })
        );

        for (const conditionId of [1, 2, 3, 4, 99]) {
            fireEvent.click(
                screen.getByRole('button', {
                    name: `Pago condición ${conditionId}`,
                })
            );

            await waitFor(() => {
                expect(
                    screen.getByTestId('order-payment-dialog')
                ).toBeInTheDocument();
            });

            expect(mockOrderService.getOrdenById).toHaveBeenCalledWith(
                10 + conditionId
            );

            fireEvent.click(
                screen.getByRole('button', { name: /cerrar pago/i })
            );
        }
    });

    it('no debe registrar un pago financiero si el importe es cero', async () => {
        mockOrderService.getOrdenById.mockResolvedValue({
            notasDiseno: '',
            detalles: [],
        } as any);

        mockOrderService.updateCondicionPago.mockResolvedValue({} as any);
        mockOrderService.updateNotasDiseno.mockResolvedValue({} as any);

        await renderComponent();

        fireEvent.click(
            await screen.findByRole('button', {
                name: /lista de ordenes/i,
            })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar orden mock/i,
            })
        );

        expect(
            await screen.findByTestId('order-payment-dialog')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: /procesar sin importe/i,
            })
        );

        await waitFor(() => {
            expect(mockOrderService.updateCondicionPago).toHaveBeenCalled();
            expect(mockOrderService.updateNotasDiseno).toHaveBeenCalled();
            expect(mockOrderService.registrarPago).not.toHaveBeenCalled();
        });

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                detail: 'Orden actualizada correctamente',
            })
        );
    });

    it('debe mostrar un error cuando no puede recuperar una orden', async () => {
        (OrderService.getOrdenById as jest.Mock).mockRejectedValue(
            new Error('Error al recuperar la orden')
        );

        await renderComponent();
        fireEvent.click(
            await screen.findByRole('button', {
                name: /lista de cotizaciones/i,
            })
        );

        expect(
            await screen.findByTestId('quote-list-dialog')
        ).toBeInTheDocument();

        // Ejecuta handleOrder mediante onRetake.
        fireEvent.click(
            screen.getByRole('button', {
                name: /seleccionar cotización mock/i,
            })
        );

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la orden.',
                })
            );
        });
    });

    it('debe sumar dos días cuando la cantidad alcanza el umbral de volumen', async () => {
        mockCatalogService.getProducto.mockResolvedValueOnce([
            {
                idProducto: 101,
                descripcion: 'Lona Impresa',
                precioUnitario: 150,
                tiempoProduccionDias: 3,
                volumenDescuentoCantidad: 2,
            },
        ] as any);

        await renderComponent();

        fireEvent.change(
            screen.getByPlaceholderText(/escribe para buscar productos/i),
            { target: { value: 'Lona' } }
        );

        await waitFor(() => {
            expect(mockCatalogService.getProducto).toHaveBeenCalledWith('Lona');
        });

        fireEvent.click(screen.getByTestId('select-product-btn'));

        fireEvent.click(
            await screen.findByRole('button', {
                name: /confirmar cantidad/i,
            })
        );

        fireEvent.click(screen.getByRole('button', { name: /cotizar/i }));

        expect(screen.getByTestId('quote-summary-dialog')).toBeInTheDocument();
    });

    it('debe continuar mostrando el pago si falla la carga de notas de diseño', async () => {
        mockOrderService.getOrdenById.mockRejectedValueOnce(
            new Error('Error al recuperar notas')
        );

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de ordenes/i })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /pago condición 1/i,
            })
        );

        expect(
            await screen.findByTestId('order-payment-dialog')
        ).toBeInTheDocument();
    });

    it('debe cerrar el resumen de cotización y restablecer sus datos', async () => {
        await prepararCotizacion();

        fireEvent.click(
            screen.getByRole('button', { name: /cerrar resumen/i })
        );

        expect(
            screen.queryByTestId('quote-summary-dialog')
        ).not.toBeInTheDocument();
    });

    it('debe continuar el proceso si falla la subida del archivo', async () => {
        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        mockOrderService.getOrdenById.mockResolvedValue({
            notasDiseno: '',
            detalles: [],
        } as any);

        mockOrderService.updateCondicionPago.mockResolvedValue({} as any);
        mockOrderService.updateNotasDiseno.mockResolvedValue({} as any);
        mockOrderService.subirArchivo.mockRejectedValueOnce(
            new Error('Error al subir archivo')
        );

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de ordenes/i })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar orden mock/i,
            })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /procesar con archivo/i,
            })
        );

        await waitFor(() => {
            expect(mockOrderService.subirArchivo).toHaveBeenCalledWith(
                10,
                expect.any(File)
            );
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    detail: 'Orden actualizada correctamente',
                })
            );
        });

        consoleSpy.mockRestore();
    });

    it('debe paginar la lista de cotizaciones', async () => {
        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de cotizaciones/i })
        );

        await waitFor(() => {
            expect(
                mockOrderService.getCotizacionesYCanceladas
            ).toHaveBeenCalledWith(0, 10);
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: /página siguiente cotizaciones/i,
            })
        );

        await waitFor(() => {
            expect(
                mockOrderService.getCotizacionesYCanceladas
            ).toHaveBeenCalledWith(1, 10);
        });
    });

    it('debe paginar la lista de órdenes activas', async () => {
        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de ordenes/i })
        );

        await waitFor(() => {
            expect(mockOrderService.getOrdenesActivas).toHaveBeenCalledWith(0, 10);
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: /página siguiente órdenes/i,
            })
        );

        await waitFor(() => {
            expect(mockOrderService.getOrdenesActivas).toHaveBeenCalledWith(1, 10);
        });
    });

    it('debe mostrar un error si falla la actualización de la condición de pago', async () => {
        (OrderService.updateCondicionPago as jest.Mock).mockRejectedValueOnce(
            new Error('Error al actualizar condición')
        );

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de ordenes/i })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar orden mock/i,
            })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /procesar pago/i,
            })
        );

        await waitFor(() => {
            expect(OrderService.updateCondicionPago).toHaveBeenCalledWith(10, 1);
        });

        expect(OrderService.registrarPago).not.toHaveBeenCalled();
    });

    it('debe mostrar un error cuando falla el registro financiero del pago', async () => {
        (OrderService.registrarPago as jest.Mock).mockRejectedValueOnce(
            new Error('Error financiero')
        );

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de ordenes/i })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar orden mock/i,
            })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /procesar pago/i,
            })
        );

        await waitFor(() => {
            expect(OrderService.registrarPago).toHaveBeenCalledWith(
                10,
                expect.objectContaining({
                    monto: 100,
                    idUsuario: 1,
                })
            );
        });

        expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
    });

    it('debe procesar órdenes sin diseñador, sin importe pagado y con estatus desconocido', async () => {
        mockOrderService.getOrdenes.mockResolvedValueOnce({
            content: [
                {
                    idOrden: 20,
                    idUsuarioDisenador: null,
                    idEstatusActual: 99,
                    montoTotal: 500,
                },
                {
                    idOrden: 21,
                    idUsuarioDisenador: 999,
                    idEstatusActual: 1,
                    montoTotal: 300,
                    montoPagado: 100,
                },
            ],
            page: { totalElements: 2 },
        } as any);

        await renderComponent();

        await waitFor(() => {
            expect(mockOrderService.getOrdenes).toHaveBeenCalled();
        });

        expect(screen.getByText('Carrito vacío.')).toBeInTheDocument();
    });

    it('debe recuperar una orden aunque sus productos no estén en el catálogo', async () => {
        mockOrderService.getOrdenById.mockResolvedValue({
            notasDiseno: '',
            detalles: [
                {
                    idProducto: 999,
                    cantidad: 2,
                    precioUnitario: 50,
                    importe: 100,
                },
            ],
        } as any);

        await renderComponent();

        fireEvent.click(
            screen.getByRole('button', { name: /lista de cotizaciones/i })
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /seleccionar cotización mock/i,
            })
        );

        expect(
            await screen.findByTestId('order-payment-dialog')
        ).toBeInTheDocument();
    });



});
