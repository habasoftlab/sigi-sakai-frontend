
import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrintOrderPage from './page';
import { OrderService } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';
import { ClientService } from '@/app/service/clientService';
const originalFetch = global.fetch;

beforeAll(() => {
    global.fetch = jest.fn();
});

afterAll(() => {
    if (originalFetch) {
        global.fetch = originalFetch;
    } else {
        delete (global as { fetch?: typeof fetch }).fetch;
    }
});

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getOrdenById: jest.fn(),
        getArchivoUrlVerificado: jest.fn(),
        avanzarEstatus: jest.fn(),
    },
}));

jest.mock('@/app/service/catalogService', () => ({
    CatalogService: {
        getAllProductos: jest.fn(),
    },
}));

jest.mock('@/app/service/clientService', () => ({
    ClientService: {
        getById: jest.fn(),
    },
}));

const mockRouterPush = jest.fn();

jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: (key: string) => (key === 'id' ? '123' : null),
    }),
    useRouter: () => ({
        push: mockRouterPush,
        replace: jest.fn(),
        back: jest.fn(),
    }),
}));

const mockShowToast = jest.fn();

jest.mock('primereact/toast', () => {
    const React = jest.requireActual('react');

    return {
        Toast: React.forwardRef((_props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                show: mockShowToast,
            }));

            return <div data-testid="primereact-toast" />;
        }),
    };
});

jest.mock('primereact/card', () => ({
    Card: ({ children, title, className }: any) => (
        <section className={className}>
            {title && <h2>{title}</h2>}
            {children}
        </section>
    ),
}));

jest.mock('primereact/button', () => ({
    Button: ({
        label,
        icon,
        onClick,
        disabled,
        loading,
        className,
        ...props
    }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={className}
            aria-label={label}
            {...props}
        >
            {icon && <i className={icon} aria-hidden="true" />}
            {label}
        </button>
    ),
}));

jest.mock('primereact/tag', () => ({
    Tag: ({ value }: any) => <span>{value}</span>,
}));

jest.mock('primereact/image', () => ({
    Image: ({
        alt,
        src,
        onError,
    }: {
        alt?: string;
        src?: string;
        onError?: React.ReactEventHandler<HTMLImageElement>;
    }) => (
        <img
            src={src}
            alt={alt}
            onError={onError}
        />
    ),
}));

jest.mock('primereact/datatable', () => ({
    DataTable: ({ children, value, emptyMessage }: any) => {
        const columns = React.Children.toArray(children) as React.ReactElement[];

        if (!value || value.length === 0) {
            return <div data-testid="orders-datatable">{emptyMessage}</div>;
        }

        return (
            <table data-testid="orders-datatable">
                <tbody>
                    {value.map((item: any, rowIndex: number) => (
                        <tr key={item.idDetalle ?? rowIndex}>
                            {columns.map((column, columnIndex) => {
                                const { field, body } = column.props;

                                return (
                                    <td key={field ?? columnIndex}>
                                        {body
                                            ? body(item, {
                                                rowIndex,
                                            })
                                            : item[field] ?? ''}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    },
}));

jest.mock('primereact/column', () => ({
    Column: () => null,
}));

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
            if (
                React.isValidElement(children) &&
                children.type === 'a'
            ) {
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

const mockOrder = {
    idOrden: 123,
    idCliente: null,
    idEstatusActual: 5,
    fechaEntregaFormal: '2026-10-25',
    clienteNombre: 'Cliente de prueba',
    notasDiseno: 'Imprimir a color',
    comentarios: '',
    rutaArchivo: null,
    detalles: [
        {
            idDetalle: 1,
            idProducto: 10,
            cantidad: 100,
        },
    ],
};

const mockProducts = [
    {
        idProducto: 10,
        descripcion: 'Tarjetas de presentación',
        formatoTamano: '9x5 cm',
        unidadVenta: 'Millar',
        precioUnitario: 150,
    },
];

const mockClient = {
    idCliente: 1,
    nombre: 'Cliente de prueba',
    telefono: '5551234567',
};

describe('PrintOrderPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();

        window.localStorage.setItem(
            'user',
            JSON.stringify({ idUsuario: 1 })
        );

        jest.mocked(OrderService.getOrdenById).mockResolvedValue(
            mockOrder as any
        );

        jest.mocked(CatalogService.getAllProductos).mockResolvedValue(
            mockProducts as any
        );

        jest.mocked(OrderService.avanzarEstatus).mockResolvedValue(
            {} as any
        );

        jest.mocked(ClientService.getById).mockResolvedValue(
            mockClient as any
        );

        jest.mocked(OrderService.getArchivoUrlVerificado).mockResolvedValue(
            null as any
        );
    });

    it('muestra el spinner mientras se carga la orden', () => {
        jest.mocked(OrderService.getOrdenById).mockReturnValue(
            new Promise(() => { }) as any
        );

        jest.mocked(CatalogService.getAllProductos).mockReturnValue(
            new Promise(() => { }) as any
        );

        const { container } = render(<PrintOrderPage />);

        expect(
            container.querySelector('.pi-spinner')
        ).toBeInTheDocument();

        expect(
            screen.getByTestId('primereact-toast')
        ).toBeInTheDocument();
    });

    it('muestra la pantalla de error cuando falla la carga', async () => {
        const error = new Error('Error de conexión');

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        jest.mocked(OrderService.getOrdenById).mockRejectedValue(error);

        jest.mocked(CatalogService.getAllProductos).mockResolvedValue(
            mockProducts as any
        );

        const { container } = render(<PrintOrderPage />);

        try {
            expect(
                await screen.findByText('No se pudo cargar la orden')
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    'Verifica tu conexión e intenta nuevamente.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByRole('button', {
                    name: /volver a la lista/i,
                })
            ).toBeInTheDocument();

            await waitFor(() => {
                expect(
                    container.querySelector('.pi-spinner')
                ).not.toBeInTheDocument();
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error cargando datos',
                error
            );

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la orden.',
                })
            );
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('permite volver a la lista cuando ocurre un error', async () => {
        jest.mocked(OrderService.getOrdenById).mockRejectedValue(
            new Error('Error de conexión')
        );

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        try {
            render(<PrintOrderPage />);

            const backButton = await screen.findByRole('button', {
                name: /volver a la lista/i,
            });

            fireEvent.click(backButton);

            expect(mockRouterPush).toHaveBeenCalledWith('/workshoplist');
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('muestra los detalles de la orden después de cargar', async () => {
        render(<PrintOrderPage />);

        expect(
            await screen.findByText('Orden N° 123')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Detalles de impresión')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Productos requeridos')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Tarjetas de presentación')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Cliente de prueba')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Imprimir a color')
        ).toBeInTheDocument();

        expect(
            screen.getByText('En impresión')
        ).toBeInTheDocument();

        expect(OrderService.getOrdenById).toHaveBeenCalledWith(123);

        expect(CatalogService.getAllProductos).toHaveBeenCalled();
    });

    it('consulta los datos del cliente cuando la orden tiene idCliente', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            idCliente: 1,
        } as any);

        render(<PrintOrderPage />);

        await waitFor(() => {
            expect(ClientService.getById).toHaveBeenCalledWith(1);
        });

        expect(
            await screen.findByText('5551234567')
        ).toBeInTheDocument();
    });

    it('avanza automáticamente al estado En Impresión cuando el estado inicial es 9', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 9,
        } as any);

        render(<PrintOrderPage />);

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(
                123,
                expect.objectContaining({
                    idUsuario: 1,
                    idEstatusDestino: 5,
                    clienteAprobo: true,
                })
            );
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'info',
                summary: 'Producción iniciada',
                detail: 'La orden ha sido marcada como "En Impresión".',
            })
        );

        expect(
            await screen.findByText('En impresión')
        ).toBeInTheDocument();
    });

    it('continúa mostrando la orden si falla el avance automático', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 9,
        } as any);

        jest.mocked(OrderService.avanzarEstatus).mockRejectedValue(
            new Error('No se pudo avanzar el estatus')
        );

        try {
            render(<PrintOrderPage />);

            expect(
                await screen.findByText('Orden N° 123')
            ).toBeInTheDocument();

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Error auto-avance a impresión',
                    expect.any(Error)
                );
            });
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('muestra el mensaje cuando la orden no tiene archivo adjunto', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: null,
        } as any);

        render(<PrintOrderPage />);

        expect(
            await screen.findByText('Sin archivo adjunto')
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: /descargar diseño/i,
            })
        ).not.toBeInTheDocument();
    });

    it('no muestra el botón de descarga cuando no hay archivo disponible', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: null,
        } as any);

        render(<PrintOrderPage />);

        expect(
            await screen.findByText('Sin archivo adjunto')
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: /descargar diseño/i,
            })
        ).not.toBeInTheDocument();
    });

    it('marca la orden como lista para entrega', async () => {
        render(<PrintOrderPage />);

        const finishButton = await screen.findByRole('button', {
            name: /orden lista para entrega/i,
        });

        fireEvent.click(finishButton);

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(
                123,
                expect.objectContaining({
                    idUsuario: 1,
                    idEstatusDestino: 6,
                    clienteAprobo: true,
                })
            );
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Orden Terminada',
                detail: 'La orden #123 está lista para entrega.',
            })
        );
    });

    it('muestra una notificación cuando falla la finalización de la orden', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        jest.mocked(OrderService.avanzarEstatus).mockRejectedValue(
            new Error('Error al finalizar')
        );

        try {
            render(<PrintOrderPage />);

            const finishButton = await screen.findByRole('button', {
                name: /orden lista para entrega/i,
            });

            fireEvent.click(finishButton);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo finalizar la orden.',
                    })
                );
            });

            expect(consoleErrorSpy).toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('muestra un mensaje cuando falla la carga del archivo de impresión', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: 'referencias/diseno.png',
        } as any);

        jest.mocked(OrderService.getArchivoUrlVerificado).mockResolvedValue(
            'http://localhost:8080/referencias/diseno.png' as any
        );

        render(<PrintOrderPage />);

        const image = await screen.findByRole('img', {
            name: 'Diseño Final',
        });

        fireEvent.error(image);

        expect(
            await screen.findByText('Archivo no encontrado (404)')
        ).toBeInTheDocument();
    });

    it('muestra una notificación cuando falla la descarga del diseño', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: 'referencias/diseno.png',
        } as any);

        jest.mocked(OrderService.getArchivoUrlVerificado).mockResolvedValue(
            'http://localhost:8080/referencias/diseno.png' as any
        );

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        const fetchMock = jest.mocked(global.fetch);

        fetchMock.mockResolvedValue({
            ok: false,
            status: 404,
        } as Response);

        try {
            render(<PrintOrderPage />);

            const downloadButton = await screen.findByRole('button', {
                name: /descargar diseño/i,
            });

            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error de descarga',
                        detail: 'No se pudo descargar la referencia. Verifica la conexión con el servidor.',
                    })
                );
            });

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:8080/referencias/diseno.png'
            );
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('muestra el mensaje cuando la orden no tiene productos', async () => {
        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            detalles: [],
        } as any);

        render(<PrintOrderPage />);

        expect(
            await screen.findByText('Orden N° 123')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Sin productos')
        ).toBeInTheDocument();
    });

    it('descarga el diseño cuando la respuesta contiene un archivo válido', async () => {
        const user = userEvent.setup();
        const imageUrl = 'https://example.com/disenos/tarjeta.png';
        const blob = new Blob(['contenido del diseño'], {
            type: 'image/png',
        });

        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: 'uploads/tarjeta.png',
        } as any);

        jest.mocked(OrderService.getArchivoUrlVerificado)
            .mockResolvedValue(imageUrl);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            blob: jest.fn().mockResolvedValue(blob),
        });

        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: jest.fn().mockReturnValue('blob:http://localhost/diseno'),
        });

        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: jest.fn(),
        });

        const clickSpy = jest
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => { });

        render(<PrintOrderPage />);

        await user.click(
            await screen.findByRole('button', {
                name: /descargar diseño/i,
            })
        );

        expect(OrderService.getArchivoUrlVerificado)
            .toHaveBeenCalledWith('uploads/tarjeta.png');

        expect(global.fetch).toHaveBeenCalledWith(imageUrl);
        expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(clickSpy).toHaveBeenCalled();

        clickSpy.mockRestore();
    });

    it('muestra un error cuando el archivo descargado está vacío', async () => {
        const user = userEvent.setup();
        const imageUrl = 'https://example.com/disenos/tarjeta.png';

        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: 'https://example.com/disenos/tarjeta.png',
        } as any);

        jest.mocked(OrderService.getArchivoUrlVerificado)
            .mockResolvedValue(imageUrl);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            blob: jest.fn().mockResolvedValue(new Blob([])),
        });

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        render(<PrintOrderPage />);

        await user.click(
            await screen.findByRole('button', {
                name: /descargar diseño/i,
            })
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error descargando diseño:',
                expect.any(Error)
            );
        });

        consoleSpy.mockRestore();
    });

    it('muestra un error cuando falla la conexión durante la descarga', async () => {
        const user = userEvent.setup();

        jest.mocked(OrderService.getOrdenById).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: 'https://example.com/disenos/tarjeta.png',
        } as any);

        jest.mocked(OrderService.getArchivoUrlVerificado)
            .mockResolvedValue('https://example.com/disenos/tarjeta.png');

        global.fetch = jest
            .fn()
            .mockRejectedValue(new Error('Error de conexión'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        render(<PrintOrderPage />);

        await user.click(
            await screen.findByRole('button', {
                name: /descargar diseño/i,
            })
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error descargando diseño:',
                expect.any(Error)
            );
        });

        consoleSpy.mockRestore();
    });

    it('utiliza el usuario predeterminado cuando no existe en localStorage', async () => {
        const user = userEvent.setup();

        localStorage.removeItem('user');

        render(<PrintOrderPage />);

        await user.click(
            await screen.findByRole('button', {
                name: /orden lista para entrega/i,
            })
        );

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(
                123,
                {
                    idUsuario: 1,
                    idEstatusDestino: 6,
                    clienteAprobo: true,
                }
            );
        });
    });

});
