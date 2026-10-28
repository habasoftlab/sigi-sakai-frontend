
import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import FinancePage from './page';

import { DashboardService } from '@/app/service/dashboardService';
import { CatalogService } from '@/app/service/catalogService';
import jsPDF from 'jspdf';

const mockShowToast = jest.fn();
const mockSavePDF = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetTextColor = jest.fn();
const mockPDFText = jest.fn();
const mockAutoTable = jest.fn();

jest.mock('@/app/service/dashboardService', () => ({
    DashboardService: {
        getEgresosGrafica: jest.fn(),
        getIngresosGrafica: jest.fn(),
        getTotalesCaja: jest.fn(),
        getFlujoCaja: jest.fn(),
        registrarEgreso: jest.fn(),
        registrarAjusteCaja: jest.fn(),
    },
}));

jest.mock('@/app/service/catalogService', () => ({
    CatalogService: {
        getTiposMovimiento: jest.fn(),
    },
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children, legacyBehavior }: any) =>
        legacyBehavior
            ? React.cloneElement(React.Children.only(children), { href })
            : <a href={href}>{children}</a>,
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

jest.mock('primereact/chart', () => ({
    Chart: ({ type, data }: any) => (
        <div data-testid="finance-chart" data-type={type}>
            {JSON.stringify(data)}
        </div>
    ),
}));

jest.mock('primereact/card', () => ({
    Card: ({ title, children }: any) => (
        <section>
            {title && <h2>{title}</h2>}
            {children}
        </section>
    ),
}));

jest.mock('primereact/column', () => ({
    Column: () => null,
}));

jest.mock('primereact/datatable', () => ({
    DataTable: ({ value, children, emptyMessage, loading }: any) => {
        const columns = React.Children.toArray(children) as React.ReactElement[];

        return (
            <div data-testid="movements-table" data-loading={String(loading)}>
                {value.length === 0
                    ? emptyMessage
                    : value.map((row: any, index: number) => (
                        <div key={row.id ?? index} data-testid="movement-row">
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
                    ))}
            </div>
        );
    },
}));

jest.mock('primereact/button', () => ({
    Button: ({
        label,
        icon,
        onClick,
        disabled,
        loading,
        tooltip,
        tooltipOptions,
        rounded,
        text,
        severity,
        autoFocus,
        className,
        style,
        ...props
    }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            aria-label={label || props['aria-label'] || tooltip || icon || 'Acción'}
            className={className}
            data-severity={severity}
            {...props}
        >
            {label}
            {icon && <span aria-hidden="true">{icon}</span>}
        </button>
    ),
}));

jest.mock('primereact/dropdown', () => ({
    Dropdown: ({
        value,
        options = [],
        onChange,
        placeholder,
    }: any) => (
        <select
            aria-label={placeholder || 'Seleccionar opción'}
            value={value ?? ''}
            onChange={(event) => {
                const selected = options.find(
                    (option: any) => String(option.value) === event.target.value
                );

                onChange?.({ value: selected?.value ?? null });
            }}
        >
            <option value="">{placeholder || 'Seleccionar opción'}</option>
            {options.map((option: any) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    ),
}));

jest.mock('primereact/dialog', () => ({
    Dialog: ({ visible, header, children, footer, onHide }: any) =>
        visible ? (
            <div role="dialog" aria-label={header}>
                <h2>{header}</h2>
                {children}
                {footer}
                <button type="button" onClick={onHide}>
                    Cerrar diálogo
                </button>
            </div>
        ) : null,
}));

jest.mock('primereact/inputtext', () => ({
    InputText: ({ value, onChange, placeholder }: any) => (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={onChange}
        />
    ),
}));

jest.mock('primereact/inputnumber', () => ({
    InputNumber: ({ value, onValueChange, placeholder }: any) => (
        <input
            type="number"
            placeholder={placeholder}
            value={value ?? ''}
            onChange={(event) => {
                const rawValue = event.currentTarget.value;
                onValueChange?.({
                    originalEvent: event,
                    value: rawValue === '' ? null : Number(rawValue)
                });
            }}
        />
    )
}));

jest.mock('jspdf', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        setFontSize: mockSetFontSize,
        setTextColor: mockSetTextColor,
        text: mockPDFText,
        save: mockSavePDF,
    })),
}));

jest.mock('jspdf-autotable', () => ({
    __esModule: true,
    default: (...args: any[]) => mockAutoTable(...args),
}));

const mockMovements = [
    {
        id: 1,
        fecha: '2026-10-20T10:30:00',
        concepto: 'Venta de impresiones',
        tipoMovimiento: 'INGRESO',
        monto: 1500,
        usuario: 'Contadora',
    },
    {
        id: 2,
        fecha: '2026-10-20T12:00:00',
        concepto: 'Compra de papel',
        tipoMovimiento: 'EGRESO',
        monto: 350,
        usuario: 'Contadora',
    },
];

describe('FinancePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        localStorage.setItem(
            'user',
            JSON.stringify({
                idUsuario: 1,
                nombre: 'Usuario de prueba',
            })
        );

        (DashboardService.getEgresosGrafica as jest.Mock).mockResolvedValue({
            datosGrafica: [
                { label: 'Octubre', total: 350 },
            ],
        });

        (DashboardService.getIngresosGrafica as jest.Mock).mockResolvedValue({
            datosGrafica: [
                { label: 'Octubre', value: 1500 },
            ],
        });

        (DashboardService.getTotalesCaja as jest.Mock).mockResolvedValue({
            totalIngresos: 1500,
            entradaCaja: 500,
            totalEgresos: 350,
            balance: 1650,
        });

        (DashboardService.getFlujoCaja as jest.Mock).mockResolvedValue([
            ...mockMovements,
        ]);

        (DashboardService.registrarEgreso as jest.Mock).mockResolvedValue({});
        (DashboardService.registrarAjusteCaja as jest.Mock).mockResolvedValue({});

        (CatalogService.getTiposMovimiento as jest.Mock).mockResolvedValue([
            { idTipo: 1, descripcion: 'Ingreso por ventas' },
            { idTipo: 2, descripcion: 'Compra de materiales' },
            { idTipo: 3, descripcion: 'Pago de servicios' },
        ]);
    });

    afterEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });


    it('debe mostrar el título y las secciones principales', async () => {
        render(<FinancePage />);

        expect(screen.getByText('Información financiera')).toBeInTheDocument();
        expect(screen.getByText('Ingresos y egresos')).toBeInTheDocument();
        expect(screen.getByText('Balance en Caja')).toBeInTheDocument();
        expect(screen.getByText('Movimientos recientes')).toBeInTheDocument();

        expect(
            await screen.findByText('Venta de impresiones')
        ).toBeInTheDocument();
    });

    it('debe consultar ingresos y egresos usando el período mensual', async () => {
        render(<FinancePage />);

        await waitFor(() => {
            expect(DashboardService.getEgresosGrafica).toHaveBeenCalledWith('mes');
            expect(DashboardService.getIngresosGrafica).toHaveBeenCalledWith('mes');
        });
    });

    it('debe cargar los totales y los movimientos de caja', async () => {
        render(<FinancePage />);

        await screen.findByText('Venta de impresiones');

        expect(DashboardService.getTotalesCaja).toHaveBeenCalledTimes(1);
        expect(DashboardService.getFlujoCaja).toHaveBeenCalledTimes(1);

        expect(screen.getByText('$1,650.00')).toBeInTheDocument();
        expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('debe excluir los tipos de movimiento que contengan INGRESO', async () => {
        render(<FinancePage />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Registrar Egreso' })
        );

        const dialog = await screen.findByRole('dialog', {
            name: 'Registrar Egreso',
        });

        expect(
            within(dialog).queryByRole('option', { name: 'Ingreso por ventas' })
        ).not.toBeInTheDocument();

        expect(
            within(dialog).getByRole('option', { name: 'Compra de materiales' })
        ).toBeInTheDocument();

        expect(
            within(dialog).getByRole('option', { name: 'Pago de servicios' })
        ).toBeInTheDocument();
    });

    it('debe mostrar una tabla vacía cuando no existen movimientos', async () => {
        (DashboardService.getFlujoCaja as jest.Mock).mockResolvedValue([]);

        render(<FinancePage />);

        expect(
            await screen.findByText('No hay movimientos registrados.')
        ).toBeInTheDocument();
    });

    it('debe mostrar una notificación si falla la gráfica', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });

        (DashboardService.getEgresosGrafica as jest.Mock).mockRejectedValue(
            new Error('Error de conexión')
        );

        render(<FinancePage />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la gráfica',
                })
            );
        });
    });

    it('debe mostrar una notificación si falla la carga de caja', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });

        (DashboardService.getTotalesCaja as jest.Mock).mockRejectedValue(
            new Error('Error de conexión')
        );

        render(<FinancePage />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la información de caja',
                })
            );
        });
    });

    it('debe recargar los movimientos al pulsar el botón de actualizar', async () => {
        render(<FinancePage />);

        await screen.findByText('Venta de impresiones');

        fireEvent.click(
            screen.getByRole('button', { name: 'Recargar tabla' })
        );

        await waitFor(() => {
            expect(DashboardService.getFlujoCaja).toHaveBeenCalledTimes(2);
            expect(DashboardService.getTotalesCaja).toHaveBeenCalledTimes(2);
        });
    });

    test('continúa funcionando si falla la carga de tipos de movimiento', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        jest.mocked(CatalogService.getTiposMovimiento).mockRejectedValueOnce(
            new Error('Error al cargar el catálogo')
        );

        render(<FinancePage />);

        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(
                'Error al cargar tipos de movimiento',
                expect.any(Error)
            );
        });

        expect(
            screen.getByRole('button', { name: /registrar egreso/i })
        ).toBeInTheDocument();

        consoleError.mockRestore();
    });


    describe('Registro de egresos', () => {
        const abrirDialogoEgreso = async () => {
            await screen.findByText('Compra de papel');

            fireEvent.click(
                screen.getByRole('button', { name: /registrar egreso/i })
            );

            return screen.findByRole('dialog', {
                name: 'Registrar Egreso'
            });
        };

        test('abre el diálogo para registrar un egreso', async () => {
            render(<FinancePage />);

            const dialog = await abrirDialogoEgreso();

            expect(dialog).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText('Ej. Pago de luz, Compra de papel...')
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText('$0.00')
            ).toBeInTheDocument();
        });

        test('muestra una advertencia si faltan campos obligatorios', async () => {
            render(<FinancePage />);

            await abrirDialogoEgreso();

            fireEvent.click(
                screen.getByRole('button', { name: /guardar egreso/i })
            );

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'warn',
                    summary: 'Datos Incompletos',
                    detail: 'Por favor, llena todos los campos.'
                })
            );

            expect(DashboardService.registrarEgreso).not.toHaveBeenCalled();
        });

        test('rechaza un monto igual a cero', async () => {
            render(<FinancePage />);

            await abrirDialogoEgreso();

            fireEvent.change(
                screen.getByPlaceholderText('Ej. Pago de luz, Compra de papel...'),
                { target: { value: 'Compra de tinta' } }
            );

            fireEvent.change(
                screen.getByLabelText('Selecciona el tipo'),
                { target: { value: '2' } }
            );

            const inputMonto = screen.getByPlaceholderText('$0.00');

            fireEvent.change(inputMonto, {
                target: { value: '0' }
            });

            expect(inputMonto).toHaveValue(0);

            fireEvent.click(
                screen.getByRole('button', { name: /guardar egreso/i })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'warn',
                        summary: 'Monto inválido',
                        detail: 'El monto del egreso debe ser mayor a cero.'
                    })
                );
            });

            expect(DashboardService.registrarEgreso).not.toHaveBeenCalled();
        });

        test('registra correctamente un egreso', async () => {
            render(<FinancePage />);

            await abrirDialogoEgreso();

            fireEvent.change(
                screen.getByPlaceholderText('Ej. Pago de luz, Compra de papel...'),
                { target: { value: 'Compra de tinta' } }
            );

            fireEvent.change(
                screen.getByLabelText('Selecciona el tipo'),
                { target: { value: '2' } }
            );

            fireEvent.change(screen.getByPlaceholderText('$0.00'), {
                target: { value: '250' }
            });

            fireEvent.click(
                screen.getByRole('button', { name: /guardar egreso/i })
            );

            await waitFor(() => {
                expect(DashboardService.registrarEgreso).toHaveBeenCalledWith({
                    concepto: 'Compra de tinta',
                    monto: 250,
                    idTipoMovimiento: 2,
                    idUsuarioRegistro: 1
                });
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Movimiento registrado correctamente'
                })
            );

            await waitFor(() => {
                expect(
                    screen.queryByRole('dialog', { name: 'Registrar Egreso' })
                ).not.toBeInTheDocument();
            });
        });

        test('muestra un error cuando falla el servicio de registro', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => { });
            (DashboardService.registrarEgreso as jest.Mock).mockRejectedValueOnce(
                new Error('Error del servidor')
            );

            render(<FinancePage />);

            await abrirDialogoEgreso();

            fireEvent.change(
                screen.getByPlaceholderText('Ej. Pago de luz, Compra de papel...'),
                { target: { value: 'Compra de tinta' } }
            );

            fireEvent.change(
                screen.getByLabelText('Selecciona el tipo'),
                { target: { value: '2' } }
            );

            fireEvent.change(screen.getByPlaceholderText('$0.00'), {
                target: { value: '250' }
            });

            fireEvent.click(
                screen.getByRole('button', { name: /guardar egreso/i })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error del servidor'
                    })
                );
            });
        });
    });


    describe('Ajuste de caja', () => {
        const abrirDialogoAjuste = async () => {
            await screen.findByText('Compra de papel');

            fireEvent.click(
                screen.getByRole('button', { name: /ajuste de caja/i })
            );

            return screen.findByRole('dialog', {
                name: 'Ajuste de Caja'
            });
        };

        const llenarFormularioAjuste = () => {
            fireEvent.change(
                screen.getByPlaceholderText(
                    'Ej. Fondo de caja, Compra de garrafón...'
                ),
                { target: { value: 'Reposición de fondo' } }
            );

            fireEvent.change(
                screen.getByLabelText('¿Es entrada o salida?'),
                { target: { value: 'ENTRADA' } }
            );

            fireEvent.change(screen.getByPlaceholderText('$0.00'), {
                target: { value: '500' }
            });
        };

        test('muestra una advertencia si faltan campos obligatorios', async () => {
            render(<FinancePage />);

            await abrirDialogoAjuste();

            fireEvent.click(
                screen.getByRole('button', { name: /guardar ajuste/i })
            );

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'warn',
                    summary: 'Datos Incompletos',
                    detail: 'Por favor, llena todos los campos.'
                })
            );

            expect(
                DashboardService.registrarAjusteCaja
            ).not.toHaveBeenCalled();
        });

        test('rechaza un monto igual a cero', async () => {
            render(<FinancePage />);

            await abrirDialogoAjuste();

            fireEvent.change(
                screen.getByPlaceholderText(
                    'Ej. Fondo de caja, Compra de garrafón...'
                ),
                { target: { value: 'Reposición de fondo' } }
            );

            fireEvent.change(
                screen.getByLabelText('¿Es entrada o salida?'),
                { target: { value: 'ENTRADA' } }
            );

            fireEvent.change(screen.getByPlaceholderText('$0.00'), {
                target: { value: '0' }
            });

            fireEvent.click(
                screen.getByRole('button', { name: /guardar ajuste/i })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'warn',
                        summary: 'Monto inválido',
                        detail: 'El monto del ajuste debe ser mayor a cero.'
                    })
                );
            });

            expect(
                DashboardService.registrarAjusteCaja
            ).not.toHaveBeenCalled();
        });

        test('registra correctamente un ajuste de caja', async () => {
            render(<FinancePage />);

            await abrirDialogoAjuste();
            llenarFormularioAjuste();

            fireEvent.click(
                screen.getByRole('button', { name: /guardar ajuste/i })
            );

            await waitFor(() => {
                expect(
                    DashboardService.registrarAjusteCaja
                ).toHaveBeenCalledWith({
                    monto: 500,
                    concepto: 'Reposición de fondo',
                    tipoAjuste: 'ENTRADA',
                    idUsuario: 1
                });
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Ajuste de caja registrado'
                })
            );

            await waitFor(() => {
                expect(
                    screen.queryByRole('dialog', { name: 'Ajuste de Caja' })
                ).not.toBeInTheDocument();
            });

            await waitFor(() => {
                expect(DashboardService.getFlujoCaja).toHaveBeenCalledTimes(2);
            });
        });

        test('muestra un error cuando falla el servicio de ajuste', async () => {
            (
                DashboardService.registrarAjusteCaja as jest.Mock
            ).mockRejectedValueOnce(new Error('Error al ajustar la caja'));

            render(<FinancePage />);

            await abrirDialogoAjuste();
            llenarFormularioAjuste();

            fireEvent.click(
                screen.getByRole('button', { name: /guardar ajuste/i })
            );

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al ajustar la caja'
                    })
                );
            });

            expect(
                screen.getByRole('dialog', { name: 'Ajuste de Caja' })
            ).toBeInTheDocument();
        });
    });


    describe('Exportación de reporte PDF', () => {
        test('genera y descarga el reporte financiero con el resumen y los movimientos', async () => {
            render(<FinancePage />);
            await screen.findByText('Venta de impresiones');
            await screen.findByText('Compra de papel');

            fireEvent.click(
                screen.getByRole('button', { name: /pdf|reporte|descargar/i })
            );

            expect(jsPDF).toHaveBeenCalled();

            expect(mockPDFText).toHaveBeenCalledWith(
                'Reporte financiero',
                14,
                22
            );
            expect(mockPDFText).toHaveBeenCalledWith(
                'Período del reporte: Mes',
                14,
                30
            );
            expect(mockPDFText).toHaveBeenCalledWith(
                'Resumen de caja',
                14,
                50
            );
            expect(mockPDFText).toHaveBeenCalledWith(
                'Detalle de movimientos',
                14,
                95
            );

            expect(mockPDFText).toHaveBeenCalledWith(
                expect.stringContaining('1,650'),
                14,
                58
            );
            expect(mockPDFText).toHaveBeenCalledWith(
                expect.stringContaining('1,500'),
                14,
                70
            );
            expect(mockPDFText).toHaveBeenCalledWith(
                expect.stringContaining('350'),
                14,
                76
            );

            expect(mockAutoTable).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    startY: 100,
                    head: [['Fecha', 'Concepto', 'Tipo', 'Monto']],
                    body: expect.arrayContaining([
                        expect.arrayContaining([
                            'Venta de impresiones',
                        ]),
                        expect.arrayContaining([
                            'Compra de papel',
                        ]),
                    ]),
                })
            );

            expect(mockSavePDF).toHaveBeenCalledWith(
                expect.stringMatching(/^Reporte_Financiero_Mes_/)
            );

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Reporte descargado correctamente',
                })
            );
        });
    });


    test('exporta movimientos aunque tengan fecha vacía y tipo ausente', async () => {
        jest.mocked(DashboardService.getFlujoCaja).mockResolvedValueOnce([
            {
                id: 99,
                fecha: '',
                concepto: 'Movimiento de prueba',
                tipoMovimiento: undefined as any,
                monto: 100,
                usuario: 'Usuario de prueba'
            }
        ]);

        render(<FinancePage />);

        await screen.findByText('Movimiento de prueba');

        fireEvent.click(
            screen.getByRole('button', { name: /descargar reporte/i })
        );

        await waitFor(() => {
            expect(mockAutoTable).toHaveBeenCalled();
        });

        const opcionesTabla = mockAutoTable.mock.calls[0][1];
        const fila = opcionesTabla.body.find(
            (row: unknown[]) => row.includes('Movimiento de prueba')
        );

        expect(fila).toBeDefined();
        expect(fila).toContain('');
        expect(fila).toContain(undefined);
    });

    describe('Validación del usuario activo', () => {
        test('muestra un error si se registra un egreso sin usuario activo', async () => {
            const consoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });
            try {
                render(<FinancePage />);

                await screen.findByText('Compra de papel');

                fireEvent.click(
                    screen.getByRole('button', { name: /registrar egreso/i })
                );

                fireEvent.change(
                    screen.getByPlaceholderText('Ej. Pago de luz, Compra de papel...'),
                    { target: { value: 'Compra de tinta' } }
                );

                fireEvent.change(
                    screen.getByLabelText('Selecciona el tipo'),
                    { target: { value: '2' } }
                );

                fireEvent.change(screen.getByPlaceholderText('$0.00'), {
                    target: { value: '250' }
                });

                localStorage.removeItem('user');

                fireEvent.click(
                    screen.getByRole('button', { name: /guardar egreso/i })
                );

                await waitFor(() => {
                    expect(mockShowToast).toHaveBeenCalledWith(
                        expect.objectContaining({
                            severity: 'error',
                            detail: 'No se pudo identificar al usuario activo'
                        })
                    );
                });

                expect(DashboardService.registrarEgreso).not.toHaveBeenCalled();

                expect(consoleError).toHaveBeenCalledWith(
                    'Error al registrar',
                    expect.any(Error)
                );
            } finally {
                consoleError.mockRestore();
            }
        });

        test('muestra un error si se registra un ajuste sin usuario activo', async () => {
            const consoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            try {
                render(<FinancePage />);
                await screen.findByText('Compra de papel');
                fireEvent.click(
                    screen.getByRole('button', { name: /ajuste de caja/i })
                );
                fireEvent.change(
                    screen.getByPlaceholderText(
                        'Ej. Fondo de caja, Compra de garrafón...'
                    ),
                    { target: { value: 'Reposición de fondo' } }
                );
                fireEvent.change(
                    screen.getByLabelText('¿Es entrada o salida?'),
                    { target: { value: 'ENTRADA' } }
                );
                fireEvent.change(screen.getByPlaceholderText('$0.00'), {
                    target: { value: '500' }
                });
                localStorage.removeItem('user');
                fireEvent.click(
                    screen.getByRole('button', { name: /guardar ajuste/i })
                );
                await waitFor(() => {
                    expect(mockShowToast).toHaveBeenCalledWith(
                        expect.objectContaining({
                            severity: 'error',
                            detail: 'No se pudo identificar al usuario activo'
                        })
                    );
                });
            } finally {
                consoleError.mockRestore();
            }
        });
    });
});
