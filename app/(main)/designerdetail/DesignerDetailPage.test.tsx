import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import DesignerOrderDetailPage from './page';
import { OrderService } from '@/app/service/orderService';
import { ClientService } from '@/app/service/clientService';
import { CatalogService } from '@/app/service/catalogService';

const mockPush = jest.fn();
const mockShowToast = jest.fn();
let mockOrderId = '15';

jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: (key: string) => (key === 'id' ? mockOrderId : null),
    }),
    useRouter: () => ({
        push: mockPush,
    }),
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        getOrdenById: jest.fn(),
        getArchivoUrlVerificado: jest.fn(),
        avanzarEstatus: jest.fn(),
        subirArchivo: jest.fn(),
    },
}));

jest.mock('@/app/service/clientService', () => ({
    ClientService: {
        getById: jest.fn(),
    },
}));

jest.mock('@/app/service/catalogService', () => ({
    CatalogService: {
        getAllProductos: jest.fn(),
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
    Card: ({ title, children }: any) => (
        <section>
            {title && <h2>{title}</h2>}
            {children}
        </section>
    ),
}));

jest.mock('primereact/button', () => ({
    Button: ({
        label,
        onClick,
        disabled = false,
        loading,
        severity,
        text,
        icon,
        className,
        ...props
    }: any) => (
        <button
            {...props}
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={className}
            data-severity={severity}
            data-text={text ? 'true' : undefined}
        >
            {icon && <span aria-hidden="true">{icon}</span>}
            {label}
        </button>
    ),
}));

jest.mock('primereact/fileupload', () => {
    const React = require('react');

    return {
        FileUpload: React.forwardRef(
            function MockFileUpload(
                { chooseLabel, onSelect, onClear }: any,
                ref: any,
            ) {
                React.useImperativeHandle(ref, () => ({
                    clear: () => onClear?.(),
                }));

                return (
                    <input
                        aria-label={chooseLabel || 'Seleccionar archivo'}
                        type="file"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const file = event.target.files?.[0];

                            if (file) {
                                onSelect?.({ files: [file] });
                            }
                        }}
                    />
                );
            },
        ),
    };
});

jest.mock('primereact/image', () => ({
    Image: ({
        alt,
        src,
        onError,
    }: {
        alt?: string;
        src?: string;
        onError?: React.ReactEventHandler<HTMLImageElement>;
    }) => <img alt={alt} src={src} onError={onError} />,
}));

jest.mock('primereact/datatable', () => ({
    DataTable: ({ children, value, emptyMessage }: any) => (
        <div>
            {value?.length
                ? value.map((item: any, index: number) => (
                    <div key={index}>
                        {children}
                        {item.nombreProducto}
                    </div>
                ))
                : emptyMessage}
        </div>
    ),
}));

jest.mock('primereact/column', () => ({
    Column: () => null,
}));

jest.mock('primereact/tag', () => ({
    Tag: ({ value }: any) => <span>{value}</span>,
}));

jest.mock('primereact/steps', () => ({
    Steps: () => <div data-testid="steps" />,
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children, legacyBehavior }: any) => {
        if (legacyBehavior) {
            return React.cloneElement(React.Children.only(children), { href });
        }

        return <a href={href}>{children}</a>;
    },
}));

const mockOrder = {
    idOrden: 15,
    idCliente: 3,
    idEstatusActual: 7,
    rutaArchivo: '',
    fechaEntregaFormal: '2026-11-01',
    notasDiseno: 'Diseño de tarjetas',
    detalles: [
        {
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
    },
];

const selectDesignFile = (fileName = 'diseno.pdf') => {
    const file = new File(
        ['contenido de prueba'],
        fileName,
        { type: 'application/pdf' },
    );

    const input = screen.getByLabelText('Seleccionar archivo');

    fireEvent.change(input, {
        target: { files: [file] },
    });

    return file;
};

describe('DesignerOrderDetailPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOrderId = '15';

        localStorage.setItem(
            'user',
            JSON.stringify({ idUsuario: 1 }),
        );

        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
        });

        (OrderService.getArchivoUrlVerificado as jest.Mock)
            .mockResolvedValue(null);

        (OrderService.avanzarEstatus as jest.Mock)
            .mockResolvedValue({});

        (OrderService.subirArchivo as jest.Mock)
            .mockResolvedValue({});

        (CatalogService.getAllProductos as jest.Mock)
            .mockResolvedValue(mockProducts);

        (ClientService.getById as jest.Mock).mockResolvedValue({
            nombre: 'Cliente de prueba',
            telefono: '2291234567',
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('debe mostrar los detalles de la orden', async () => {
        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Orden N° 15' }),
        ).toBeInTheDocument();

        expect(screen.getByText('Cliente de prueba')).toBeInTheDocument();
        expect(screen.getByText('2291234567')).toBeInTheDocument();
        expect(screen.getByText('Diseño de tarjetas')).toBeInTheDocument();
        expect(
            screen.getByText('Tarjetas de presentación'),
        ).toBeInTheDocument();

        expect(screen.getByText('En desarrollo')).toBeInTheDocument();
        expect(screen.getByTestId('steps')).toBeInTheDocument();
    });

    it('debe mostrar la tarjeta de entrega de diseño para el estatus 7', async () => {
        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Entrega del diseño' }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: 'Enviar a Revisión' }),
        ).toBeDisabled();
    });

    it('debe deshabilitar el envío a revisión cuando no hay archivo', async () => {
        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('button', { name: 'Enviar a Revisión' }),
        ).toBeDisabled();

        expect(OrderService.subirArchivo).not.toHaveBeenCalled();
        expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
    });

    it('debe permitir seleccionar un archivo de diseño', async () => {
        render(<DesignerOrderDetailPage />);

        await screen.findByRole('heading', { name: 'Entrega del diseño' });

        const file = selectDesignFile();

        expect(await screen.findByText('diseno.pdf')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Enviar a Revisión' }),
        ).toBeEnabled();

        expect(OrderService.subirArchivo).not.toHaveBeenCalled();
        expect(file).toBeInstanceOf(File);
    });

    it('debe mostrar la tarjeta de orden bloqueada para el estatus 2', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 2,
        });

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Orden Bloqueada' }),
        ).toBeInTheDocument();
    });

    it('debe mostrar una advertencia cuando faltan insumos', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 2,
        });

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Orden Bloqueada' }),
        ).toBeInTheDocument();

        await waitFor(
            () => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'warn',
                        summary: 'Espera',
                        detail: 'Faltan insumos del taller.',
                    }),
                );
            },
            { timeout: 2000 },
        );
    });

    it('debe mostrar las opciones de decisión para el estatus 8', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 8,
        });

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('button', {
                name: 'Aprobado (Finalizar)',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Rechazado (Corregir)',
            }),
        ).toBeInTheDocument();
    });

    it('debe mostrar el mensaje de diseño aprobado para el estatus 9', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 9,
        });

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Diseño aprobado' }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', { name: /Volver a la Lista/i }),
        ).toHaveAttribute('href', '/designerlist');
    });

    it('debe avanzar automáticamente una orden del estatus 3 al 7', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 3,
        });

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Entrega del diseño' }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(15, {
                idUsuario: 1,
                idEstatusDestino: 7,
            });
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'info',
                summary: 'Diseño iniciado',
                detail: 'La orden pasó a diseño en desarrollo.',
            }),
        );
    });

    it('debe regresar automáticamente al estatus 7 cuando la orden está en el estatus 10', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 10,
        });

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Entrega del diseño' }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(15, {
                idUsuario: 1,
                idEstatusDestino: 7,
            });
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'info',
                summary: 'Correcciones pendientes',
                detail: 'La orden regresó a diseño en desarrollo.',
            }),
        );
    });

    it('debe mostrar un error cuando falla la carga de la orden', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenById as jest.Mock).mockRejectedValueOnce(
            new Error('Error de prueba'),
        );

        render(<DesignerOrderDetailPage />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error cargando información.',
                }),
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('debe enviar el diseño a revisión cuando hay un archivo', async () => {
        render(<DesignerOrderDetailPage />);

        await screen.findByRole('heading', { name: 'Entrega del diseño' });

        const file = selectDesignFile();

        fireEvent.click(
            screen.getByRole('button', { name: 'Enviar a Revisión' }),
        );

        await waitFor(() => {
            expect(OrderService.subirArchivo).toHaveBeenCalledWith(15, file);

            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(15, {
                idUsuario: 1,
                idEstatusDestino: 8,
            });
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Diseño enviado',
                detail: 'El diseño se envió a revisión del cliente.',
            }),
        );
    });

    it('debe mostrar un error si falla la subida del archivo', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.subirArchivo as jest.Mock).mockRejectedValueOnce(
            new Error('Error de subida'),
        );

        render(<DesignerOrderDetailPage />);

        await screen.findByRole('heading', { name: 'Entrega del diseño' });

        selectDesignFile();

        fireEvent.click(
            screen.getByRole('button', { name: 'Enviar a Revisión' }),
        );

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo completar el envío a revisión.',
                }),
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error enviando diseño',
            expect.any(Error),
        );
    });

    it('debe mostrar un error si falla el cambio de estatus al enviar a revisión', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.avanzarEstatus as jest.Mock).mockRejectedValueOnce(
            new Error('Error al cambiar el estatus'),
        );

        render(<DesignerOrderDetailPage />);

        await screen.findByRole('heading', { name: 'Entrega del diseño' });

        selectDesignFile();

        fireEvent.click(
            screen.getByRole('button', { name: 'Enviar a Revisión' }),
        );

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo completar el envío a revisión.',
                }),
            );
        });

        expect(OrderService.subirArchivo).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('debe registrar el rechazo y regresar la orden a desarrollo', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 8,
        });

        render(<DesignerOrderDetailPage />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Rechazado (Corregir)',
            }),
        );

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenNthCalledWith(1, 15, {
                idUsuario: 1,
                idEstatusDestino: 10,
                clienteAprobo: false,
            });

            expect(OrderService.avanzarEstatus).toHaveBeenNthCalledWith(2, 15, {
                idUsuario: 1,
                idEstatusDestino: 7,
            });
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                summary: 'Diseño rechazado',
                detail: 'La orden regresó a desarrollo para realizar correcciones.',
            }),
        );
    });

    it('debe aprobar el diseño y redirigir a la lista', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 8,
        });

        render(<DesignerOrderDetailPage />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Aprobado (Finalizar)',
            }),
        );

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(15, {
                idUsuario: 1,
                idEstatusDestino: 9,
                clienteAprobo: true,
            });
        });

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Diseño aprobado',
                detail: 'El diseño fue enviado al taller.',
            }),
        );

        await waitFor(
            () => {
                expect(mockPush).toHaveBeenCalledWith('/designerlist');
            },
            { timeout: 2500 },
        );
    });

    it('debe mostrar un error si falla el registro de la decisión', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 8,
        });

        (OrderService.avanzarEstatus as jest.Mock).mockRejectedValueOnce(
            new Error('Error al registrar la decisión'),
        );

        render(<DesignerOrderDetailPage />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Aprobado (Finalizar)',
            }),
        );

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo completar la transición de estado. Verifica el estado actual de la orden.',
                }),
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error registrando decisión',
            expect.any(Error),
        );
    });


    it('debe mostrar un error si no se encuentra el usuario al enviar el diseño', async () => {
        render(<DesignerOrderDetailPage />);

        await screen.findByRole('heading', { name: 'Entrega del diseño' });
        selectDesignFile();

        localStorage.removeItem('user');

        fireEvent.click(
            screen.getByRole('button', { name: 'Enviar a Revisión' }),
        );

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Error',
                detail: 'No se encontró el usuario actual.',
            }),
        );

        expect(OrderService.subirArchivo).not.toHaveBeenCalled();
        expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
    });

    it('debe mostrar un error si no se encuentra el usuario al registrar una decisión', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 8,
        });

        localStorage.removeItem('user');

        render(<DesignerOrderDetailPage />);

        const approveButton = await screen.findByRole('button', {
            name: /Aprobado \(Finalizar\)/i,
        });

        fireEvent.click(approveButton);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se encontró el usuario actual.',
                }),
            );
        });

        expect(OrderService.avanzarEstatus).not.toHaveBeenCalled();
    });
    it('debe mostrar el formato predeterminado cuando no hay información del producto', async () => {
        (CatalogService.getAllProductos as jest.Mock).mockResolvedValue([]);

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByText('Producto #10'),
        ).toBeInTheDocument();
    });

    it('debe mostrar un error cuando falla la carga del catálogo', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (CatalogService.getAllProductos as jest.Mock).mockRejectedValueOnce(
            new Error('Error de catálogo'),
        );

        render(<DesignerOrderDetailPage />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error cargando información.',
                }),
            );
        });

        consoleError.mockRestore();
    });

    it('debe mostrar un error cuando falla la carga del cliente', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (ClientService.getById as jest.Mock).mockRejectedValueOnce(
            new Error('Error de cliente'),
        );

        render(<DesignerOrderDetailPage />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error cargando información.',
                }),
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('debe mostrar el mensaje cuando la referencia no se encuentra', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: 'referencias/diseno.png',
        });

        (OrderService.getArchivoUrlVerificado as jest.Mock).mockResolvedValue(
            'http://localhost:8080/referencias/diseno.png',
        );

        render(<DesignerOrderDetailPage />);

        const referenceImage = await screen.findByRole('img', {
            name: 'Referencia',
        });

        fireEvent.error(referenceImage);

        expect(
            await screen.findByText('Archivo no encontrado'),
        ).toBeInTheDocument();
    });

    it('debe mostrar la opción para descargar la referencia cuando existe', async () => {
        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: '/uploads/referencia.png',
        });

        (OrderService.getArchivoUrlVerificado as jest.Mock).mockResolvedValue(
            'https://example.com/referencia.png',
        );

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('button', { name: 'Descargar referencia' }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('img', { name: 'Referencia' }),
        ).toHaveAttribute('src', 'https://example.com/referencia.png');
    });

    it('debe mostrar un error si la descarga devuelve una respuesta HTTP fallida', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: '/uploads/referencia.png',
        });

        (OrderService.getArchivoUrlVerificado as jest.Mock).mockResolvedValue(
            'https://example.com/referencia.png',
        );

        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
        }) as jest.Mock;

        render(<DesignerOrderDetailPage />);

        fireEvent.click(
            await screen.findByRole('button', { name: 'Descargar referencia' }),
        );

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error de descarga',
                    detail: 'No se pudo descargar la referencia. Verifica la conexión con el servidor.',
                }),
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('debe mostrar un error si el archivo descargado está vacío', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            rutaArchivo: '/uploads/referencia.png',
        });

        (OrderService.getArchivoUrlVerificado as jest.Mock).mockResolvedValue(
            'https://example.com/referencia.png',
        );

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            blob: async () => new Blob([]),
        }) as jest.Mock;

        render(<DesignerOrderDetailPage />);

        fireEvent.click(
            await screen.findByRole('button', { name: 'Descargar referencia' }),
        );

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error de descarga',
                    detail: 'No se pudo descargar la referencia. Verifica la conexión con el servidor.',
                }),
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('debe manejar el error al avanzar automáticamente el estatus', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        (OrderService.getOrdenById as jest.Mock).mockResolvedValue({
            ...mockOrder,
            idEstatusActual: 4,
        });

        (OrderService.avanzarEstatus as jest.Mock).mockRejectedValueOnce(
            new Error('No se pudo avanzar'),
        );

        render(<DesignerOrderDetailPage />);

        expect(
            await screen.findByRole('heading', { name: 'Entrega del diseño' }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(OrderService.avanzarEstatus).toHaveBeenCalledWith(15, {
                idUsuario: 1,
                idEstatusDestino: 7,
            });
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error en auto-avance de estatus',
            expect.any(Error),
        );
    });

});
