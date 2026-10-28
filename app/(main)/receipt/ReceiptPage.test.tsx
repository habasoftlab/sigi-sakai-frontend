
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadReceiptPage from './page';

import { comprasService } from '@/app/service/shopService';
import { OrderService } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';

const mockPush = jest.fn();
const mockToastShow = jest.fn();

jest.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('id=123'),
    useRouter: () => ({ push: mockPush })
}));

jest.mock('next/link', () => {
    const React = require('react');

    const Link = ({ children, href }: any) => (
        <>{children}</>
    );

    Link.displayName = 'MockLink';

    return { __esModule: true, default: Link };
});

jest.mock('primereact/card', () => ({
    Card: ({ children, className }: any) => (
        <div className={className}>{children}</div>
    )
}));

jest.mock('primereact/toast', () => {
    const React = require('react');

    const Toast = React.forwardRef((_props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            show: (...args: any[]) => mockToastShow(...args)
        }));

        return <div data-testid="toast" />;
    });

    Toast.displayName = 'MockToast';

    return { Toast };
});

jest.mock('primereact/button', () => ({
    Button: ({ label, icon, tooltip, onClick, disabled }: any) => (
        <button
            type="button"
            aria-label={
                label === 'Notificar'
                    ? 'Enviar notificación'
                    : tooltip || label || icon || 'button'
            }
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span aria-hidden="true">{icon}</span>}
            {label}
        </button>
    )
}));

jest.mock('primereact/fileupload', () => ({
    FileUpload: ({ uploadHandler, chooseLabel, accept, maxFileSize }: any) => (
        <div>
            <input
                aria-label={chooseLabel}
                type="file"
                accept={accept}
                data-max-file-size={maxFileSize}
                onChange={(event) => {
                    const file = event.currentTarget.files?.[0];

                    if (file) {
                        uploadHandler({ files: [file] });
                    }
                }}
            />
        </div>
    )
}));

jest.mock('primereact/dialog', () => ({
    Dialog: ({ visible, header, children, onHide }: any) =>
        visible ? (
            <section role="dialog" aria-label={header}>
                {children}
                <button type="button" onClick={onHide}>
                    Cerrar diálogo
                </button>
            </section>
        ) : null
}));

jest.mock('primereact/inputnumber', () => ({
    InputNumber: ({ id, value, onValueChange, suffix }: any) => (
        <input
            id={id}
            aria-label="Cantidad de días de retraso"
            value={value ?? ''}
            onChange={(event) => {
                const parsedValue = event.target.value
                    ? Number(event.target.value)
                    : null;

                onValueChange({ value: parsedValue });
            }}
            data-suffix={suffix}
        />
    )
}));

jest.mock('@/app/service/shopService', () => ({
    comprasService: {
        getPendientes: jest.fn()
    }
}));

jest.mock('@/app/service/orderService', () => ({
    OrderService: {
        subirArchivo: jest.fn()
    }
}));

jest.mock('@/app/service/catalogService', () => ({
    CatalogService: {
        getProductos: jest.fn()
    }
}));

const mockSolicitud = {
    idSolicitud: 77,
    idOrden: 123,
    descripcionSolicitud: 'Material para impresión',
    fechaCreacion: '2026-01-15T10:30:00',
    detalles: [
        {
            idDetalle: 1,
            idProducto: 10,
            cantidad: 2
        },
        {
            idDetalle: 2,
            idProducto: 20,
            cantidad: 5
        },
        {
            idDetalle: 3,
            idProducto: 30,
            cantidad: 3
        }
    ]
};

const mockProductos = [
    {
        idProducto: 10,
        nombre: 'Papel couché',
        unidadVenta: 'Millar',
        cantidadPaquete: 1000,
        formatoTamano: 'Carta'
    },
    {
        idProducto: 20,
        nombre: 'Lona',
        unidadVenta: 'm²',
        cantidadPaquete: 1,
        formatoTamano: 'Gran formato'
    }
];

beforeEach(() => {
    jest.clearAllMocks();

    mockGetPendientes.mockResolvedValue([mockSolicitud]);
    mockGetProductos.mockResolvedValue(mockProductos);
    mockSubirArchivo.mockResolvedValue(undefined);
});

const mockGetPendientes = comprasService.getPendientes as jest.Mock;
const mockGetProductos = CatalogService.getProductos as jest.Mock;
const mockSubirArchivo = OrderService.subirArchivo as jest.Mock;

const renderPage = () => render(<UploadReceiptPage />);

describe('UploadReceiptPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetPendientes.mockResolvedValue([mockSolicitud]);
        mockGetProductos.mockResolvedValue(mockProductos);
        mockSubirArchivo.mockResolvedValue(undefined);
    });

    it('muestra el indicador de carga mientras obtiene los datos', () => {
        mockGetPendientes.mockReturnValue(new Promise(() => { }));

        renderPage();

        expect(
            screen.getByText('Cargando solicitud de insumos...')
        ).toBeInTheDocument();
    });

    it('carga la solicitud correspondiente a la orden y los productos', async () => {
        renderPage();

        expect(
            await screen.findByText('Material para impresión')
        ).toBeInTheDocument();

        expect(mockGetPendientes).toHaveBeenCalledTimes(1);
        expect(mockGetProductos).toHaveBeenCalledTimes(1);
    });

    it('muestra el identificador de la orden y los datos de la solicitud', async () => {
        renderPage();

        expect(await screen.findByText('Orden N° 123')).toBeInTheDocument();
        expect(screen.getByText(/Solicitud #77/)).toBeInTheDocument();
        expect(
            screen.getByText('Materiales / Insumos requeridos:')
        ).toBeInTheDocument();
    });

    it('formatea la cantidad de productos vendidos por paquete', async () => {
        renderPage();

        expect(
            await screen.findByText('2 Millar (2,000 pzs en total)')
        ).toBeInTheDocument();
    });

    it('muestra la cantidad en metros cuadrados para productos de esa unidad', async () => {
        renderPage();

        expect(await screen.findByText('5 m²')).toBeInTheDocument();
    });

    it('muestra el nombre y formato del producto cuando están disponibles', async () => {
        renderPage();

        expect(await screen.findByText('Papel couché')).toBeInTheDocument();
        expect(screen.getByText('Formato: Carta')).toBeInTheDocument();
        expect(screen.getByText('Lona')).toBeInTheDocument();
        expect(screen.getByText('Formato: Gran formato')).toBeInTheDocument();
    });

    it('usa el identificador del producto si no existe en el catálogo', async () => {
        mockGetProductos.mockResolvedValue([]);

        renderPage();

        expect(
            await screen.findByText('Producto ID #10')
        ).toBeInTheDocument();

        expect(screen.getByText('2 unidad(es)')).toBeInTheDocument();
    });

    it('muestra un mensaje cuando la solicitud no existe para la orden', async () => {
        mockGetPendientes.mockResolvedValueOnce([]);

        renderPage();

        await waitFor(() => {
            expect(mockGetPendientes).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'warn',
                    summary: 'Solicitud no encontrada',
                    detail: expect.stringContaining('123')
                })
            );
        });
    });

    it('muestra un error si falla la carga de solicitudes', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        mockGetPendientes.mockRejectedValueOnce(
            new Error('Error de servidor')
        );

        renderPage();

        await waitFor(() => {
            expect(mockGetPendientes).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error de Servidor'
                })
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error al cargar la información:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it('continúa mostrando la solicitud si falla la carga del catálogo', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        mockGetProductos.mockRejectedValue(new Error('Catálogo no disponible'));

        renderPage();

        expect(
            await screen.findByText('Material para impresión')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Producto ID #10')
        ).toBeInTheDocument();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error al cargar productos:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it('sube el comprobante de la orden y muestra confirmación', async () => {
        renderPage();

        const file = new File(['comprobante'], 'recibo.pdf', {
            type: 'application/pdf'
        });

        const fileInput = await screen.findByLabelText('Sube tu recibo');

        fireEvent.change(fileInput, {
            target: { files: [file] }
        });

        await waitFor(() => {
            expect(mockSubirArchivo).toHaveBeenCalledWith(123, file);
        });

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Comprobante Subido'
            })
        );
    });

    it('muestra un mensaje si falla la subida del comprobante', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        mockSubirArchivo.mockRejectedValue(new Error('Error al subir'));

        renderPage();

        const file = new File(['comprobante'], 'recibo.png', {
            type: 'image/png'
        });

        const fileInput = await screen.findByLabelText('Sube tu recibo');

        fireEvent.change(fileInput, {
            target: { files: [file] }
        });

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                    summary: 'Error'
                })
            );
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error al subir comprobante:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it('redirige después de subir correctamente el comprobante', async () => {
        jest.useFakeTimers();

        renderPage();

        const file = new File(['comprobante'], 'recibo.pdf', {
            type: 'application/pdf'
        });

        const fileInput = await screen.findByLabelText('Sube tu recibo');

        fireEvent.change(fileInput, {
            target: { files: [file] }
        });

        await waitFor(() => {
            expect(mockSubirArchivo).toHaveBeenCalledWith(123, file);
        });

        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        expect(mockPush).toHaveBeenCalledWith('/');

        jest.useRealTimers();
    });

    it('abre el diálogo para notificar retraso', async () => {
        renderPage();

        await screen.findByText('Material para impresión');

        fireEvent.click(
            screen.getByRole('button', { name: 'Notificar retraso (Días)' })
        );

        expect(
            screen.getByRole('dialog', { name: 'Insumos Atrasados' })
        ).toBeInTheDocument();
    });

    it('advierte si se intenta notificar sin ingresar días', async () => {
        renderPage();

        await screen.findByText('Material para impresión');

        fireEvent.click(
            screen.getByRole('button', { name: 'Notificar retraso (Días)' })
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Enviar notificación' })
        );

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                summary: 'Días requeridos'
            })
        );

        expect(
            screen.getByRole('dialog', { name: 'Insumos Atrasados' })
        ).toBeInTheDocument();
    });

    it('notifica el retraso cuando se ingresan días válidos', async () => {
        renderPage();

        await screen.findByText('Material para impresión');

        fireEvent.click(
            screen.getByRole('button', { name: 'Notificar retraso (Días)' })
        );

        fireEvent.change(
            screen.getByRole('textbox', {
                name: 'Cantidad de días de retraso'
            }),
            { target: { value: '4' } }
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Enviar notificación' })
        );

        expect(mockToastShow).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'info',
                summary: 'Notificación Enviada',
                detail: 'Se ha reportado un retraso de 4 días al equipo.'
            })
        );

        expect(
            screen.queryByRole('dialog', { name: 'Insumos Atrasados' })
        ).not.toBeInTheDocument();
    });

    it('cierra el diálogo de retraso al cancelar', async () => {
        renderPage();

        await screen.findByText('Material para impresión');

        fireEvent.click(
            screen.getByRole('button', { name: 'Notificar retraso (Días)' })
        );

        fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));

        expect(
            screen.queryByRole('dialog', { name: 'Insumos Atrasados' })
        ).not.toBeInTheDocument();
    });
});
