import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListProductsPage from './page';
import { CatalogService } from '@/app/service/catalogService';

const mockShowToast = jest.fn();
const mockProductFormDialog = jest.fn();

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
        rounded,
        text,
        severity,
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
    Tag: ({ value }: any) => <span data-testid="product-tag">{value}</span>
}));

jest.mock('primereact/inputtext', () => ({
    InputText: ({ value, onChange, placeholder, ...props }: any) => (
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            {...props}
        />
    )
}));

jest.mock('primereact/column', () => ({
    Column: () => null
}));

jest.mock('primereact/dialog', () => ({
    Dialog: ({ visible, header, children, footer, onHide }: any) =>
        visible ? (
            <div role="dialog" aria-label={header}>
                <h2>{header}</h2>
                <div>{children}</div>
                <div>{footer}</div>
                <button type="button" onClick={onHide}>
                    Cerrar diálogo
                </button>
            </div>
        ) : null
}));

jest.mock('primereact/datatable', () => ({
    DataTable: ({
        value = [],
        children,
        header,
        loading,
        emptyMessage,
        filters,
        globalFilterFields = []
    }: any) => {
        const React = jest.requireActual('react');
        const columns = React.Children.toArray(children) as any[];
        const searchValue = filters?.global?.value?.toLowerCase?.() || '';

        const filteredProducts = value.filter((product: any) => {
            if (!searchValue) {
                return true;
            }

            return globalFilterFields.some((field: string) =>
                String(product[field] ?? '')
                    .toLowerCase()
                    .includes(searchValue)
            );
        });

        return (
            <div>
                <div>{header}</div>
                {loading && <span role="status">Cargando productos</span>}
                <table>
                    <thead>
                        <tr>
                            {columns.map((column: any, index: number) => (
                                <th key={index}>{column.props.header || 'Acciones'}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product: any) => (
                                <tr key={product.idProducto}>
                                    {columns.map((column: any, index: number) => {
                                        const props = column.props;
                                        const content = props.body
                                            ? props.body(product)
                                            : product[props.field];

                                        return <td key={index}>{content ?? ''}</td>;
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length}>
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

jest.mock('@/app/components/ProductFormDialog', () => ({
    ProductFormDialog: (props: any) => {
        mockProductFormDialog(props);

        return props.visible ? (
            <div role="dialog" aria-label="Formulario de producto">
                <span>
                    {props.productToEdit
                        ? `Editando: ${props.productToEdit.descripcion}`
                        : 'Nuevo producto'}
                </span>
                <button type="button" onClick={props.onHide}>
                    Cerrar formulario
                </button>
                <button type="button" onClick={props.onSuccess}>
                    Guardar producto simulado
                </button>
            </div>
        ) : null;
    }
}));

jest.mock('@/app/service/catalogService', () => ({
    CatalogService: {
        getProductos: jest.fn(),
        deleteProducto: jest.fn()
    }
}));

const mockProducts = [
    {
        idProducto: 10,
        nombre: 'Tarjetas',
        descripcion: 'Tarjetas básicas couché 300g',
        precioUnitario: 150,
        precioPaquete: 1200,
        cantidadPaquete: 1000,
        tiempoProduccionDias: 2,
        formatoTamano: '9x5 cm',
        unidadVenta: 'Millar',
        tirajeMinimo: 1,
        volumenDescuentoCantidad: 0
    },
    {
        idProducto: 20,
        nombre: 'Volantes',
        descripcion: 'Volantes publicitarios',
        precioUnitario: 80,
        precioPaquete: 700,
        cantidadPaquete: 500,
        tiempoProduccionDias: 3,
        formatoTamano: 'Carta',
        unidadVenta: 'Paquete',
        tirajeMinimo: 1,
        volumenDescuentoCantidad: 0
    }
];

const configureServices = () => {
    (CatalogService.getProductos as jest.Mock).mockResolvedValue(mockProducts);
    (CatalogService.deleteProducto as jest.Mock).mockResolvedValue(undefined);
};

const renderPage = async () => {
    render(<ListProductsPage />);

    expect(await screen.findByText('Tarjetas básicas couché 300g')).toBeInTheDocument();
};

describe('ListProductsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        configureServices();
    });

    describe('Carga inicial', () => {
        it('muestra el título de la página', async () => {
            await renderPage();

            expect(screen.getByRole('heading', { name: 'Lista de Productos' })).toBeInTheDocument();
        });

        it('carga los productos desde el servicio', async () => {
            await renderPage();

            expect(CatalogService.getProductos).toHaveBeenCalledTimes(1);
        });

        it('muestra los datos principales de los productos', async () => {
            await renderPage();

            expect(screen.getByText('Tarjetas básicas couché 300g')).toBeInTheDocument();
            expect(screen.getByText('Volantes publicitarios')).toBeInTheDocument();
            expect(screen.getByText('9x5 cm')).toBeInTheDocument();
            expect(screen.getByText('Carta')).toBeInTheDocument();
            expect(screen.getByText('Millar')).toBeInTheDocument();
            expect(screen.getByText('Paquete')).toBeInTheDocument();
        });

        it('muestra los precios con formato de moneda mexicana', async () => {
            await renderPage();

            expect(screen.getByText('$150.00')).toBeInTheDocument();
            expect(screen.getByText('$1,200.00')).toBeInTheDocument();
            expect(screen.getByText('$80.00')).toBeInTheDocument();
            expect(screen.getByText('$700.00')).toBeInTheDocument();
        });

        it('muestra los tiempos de producción', async () => {
            await renderPage();

            expect(screen.getByText('2 días')).toBeInTheDocument();
            expect(screen.getByText('3 días')).toBeInTheDocument();
        });

        it('muestra un mensaje cuando no existen productos', async () => {
            (CatalogService.getProductos as jest.Mock).mockResolvedValue([]);

            render(<ListProductsPage />);

            expect(
                await screen.findByText('No se encontraron productos.')
            ).toBeInTheDocument();
        });

        it('muestra una notificación cuando falla la carga', async () => {
            (CatalogService.getProductos as jest.Mock).mockRejectedValue(
                new Error('Error de conexión')
            );

            render(<ListProductsPage />);

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar los productos'
                    })
                );
            });
        });

        it('permite volver a caja', async () => {
            await renderPage();

            expect(screen.getByRole('link', { name: /Volver/i })).toHaveAttribute(
                'href',
                '/counter'
            );
        });
    });

    describe('Búsqueda', () => {
        it('filtra los productos por descripción', async () => {
            await renderPage();

            fireEvent.change(screen.getByPlaceholderText('Buscar producto...'), {
                target: { value: 'Volantes' }
            });

            expect(screen.getByText('Volantes publicitarios')).toBeInTheDocument();
            expect(
                screen.queryByText('Tarjetas básicas couché 300g')
            ).not.toBeInTheDocument();
        });

        it('permite buscar por tamaño', async () => {
            await renderPage();

            fireEvent.change(screen.getByPlaceholderText('Buscar producto...'), {
                target: { value: 'Carta' }
            });

            expect(screen.getByText('Volantes publicitarios')).toBeInTheDocument();
            expect(
                screen.queryByText('Tarjetas básicas couché 300g')
            ).not.toBeInTheDocument();
        });

        it('permite buscar por unidad de venta', async () => {
            await renderPage();

            fireEvent.change(screen.getByPlaceholderText('Buscar producto...'), {
                target: { value: 'Millar' }
            });

            expect(screen.getByText('Tarjetas básicas couché 300g')).toBeInTheDocument();
            expect(
                screen.queryByText('Volantes publicitarios')
            ).not.toBeInTheDocument();
        });

        it('muestra el mensaje cuando no hay coincidencias', async () => {
            await renderPage();

            fireEvent.change(screen.getByPlaceholderText('Buscar producto...'), {
                target: { value: 'Producto inexistente' }
            });

            expect(
                screen.getByText('No se encontraron productos.')
            ).toBeInTheDocument();
        });
    });

    describe('Creación y edición', () => {
        it('abre el formulario para crear un producto', async () => {
            await renderPage();

            fireEvent.click(screen.getByRole('button', { name: 'Nuevo Producto' }));

            expect(screen.getByRole('dialog', { name: 'Formulario de producto' })).toBeInTheDocument();
            expect(screen.getByText('Nuevo producto')).toBeInTheDocument();

            expect(mockProductFormDialog).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    visible: true,
                    productToEdit: null
                })
            );
        });

        it('cierra el formulario al cancelar', async () => {
            await renderPage();

            fireEvent.click(screen.getByRole('button', { name: 'Nuevo Producto' }));
            fireEvent.click(screen.getByRole('button', { name: 'Cerrar formulario' }));

            expect(
                screen.queryByRole('dialog', { name: 'Formulario de producto' })
            ).not.toBeInTheDocument();
        });

        it('abre el formulario con los datos del producto seleccionado', async () => {
            await renderPage();

            const row = screen.getByText('Tarjetas básicas couché 300g').closest('tr');

            expect(row).not.toBeNull();

            fireEvent.click(
                within(row as HTMLElement).getAllByRole('button')[0]
            );

            expect(screen.getByText('Editando: Tarjetas básicas couché 300g')).toBeInTheDocument();

            expect(mockProductFormDialog).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    visible: true,
                    productToEdit: expect.objectContaining({
                        idProducto: 10,
                        descripcion: 'Tarjetas básicas couché 300g'
                    })
                })
            );
        });

        it('recarga los productos y muestra una notificación tras guardar', async () => {
            await renderPage();

            fireEvent.click(screen.getByRole('button', { name: 'Nuevo Producto' }));
            fireEvent.click(screen.getByRole('button', { name: 'Guardar producto simulado' }));

            await waitFor(() => {
                expect(CatalogService.getProductos).toHaveBeenCalledTimes(2);
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Producto guardado correctamente'
                })
            );

            expect(
                screen.queryByRole('dialog', { name: 'Formulario de producto' })
            ).not.toBeInTheDocument();
        });
    });

    describe('Eliminación', () => {
        const openDeleteDialog = async () => {
            await renderPage();

            const row = screen.getByText('Tarjetas básicas couché 300g').closest('tr');

            expect(row).not.toBeNull();

            fireEvent.click(
                within(row as HTMLElement).getAllByRole('button')[1]
            );

            expect(
                await screen.findByRole('dialog', { name: 'Confirmar Eliminación' })
            ).toBeInTheDocument();
        };

        it('abre el diálogo de confirmación', async () => {
            await openDeleteDialog();

            const dialog = screen.getByRole('dialog', {
                name: 'Confirmar Eliminación'
            });

            expect(
                within(dialog).getByText('Tarjetas básicas couché 300g')
            ).toBeInTheDocument();
        });

        it('cierra el diálogo al seleccionar No', async () => {
            await openDeleteDialog();

            fireEvent.click(screen.getByRole('button', { name: 'No' }));

            expect(
                screen.queryByRole('dialog', { name: 'Confirmar Eliminación' })
            ).not.toBeInTheDocument();
        });

        it('elimina el producto y muestra una notificación de éxito', async () => {
            await openDeleteDialog();

            fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

            await waitFor(() => {
                expect(CatalogService.deleteProducto).toHaveBeenCalledWith(10);
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                    summary: 'Eliminado',
                    detail: 'Producto eliminado correctamente'
                })
            );

            await waitFor(() => {
                expect(
                    screen.queryByText('Tarjetas básicas couché 300g')
                ).not.toBeInTheDocument();
            });

            expect(screen.getByText('Volantes publicitarios')).toBeInTheDocument();
        });

        it('muestra un error si falla la eliminación', async () => {
            (CatalogService.deleteProducto as jest.Mock).mockRejectedValue(
                new Error('Error al eliminar')
            );

            await openDeleteDialog();

            fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo eliminar el producto'
                    })
                );
            });
        });

        it('permite cerrar el diálogo mediante su botón de cierre', async () => {
            await openDeleteDialog();

            fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));

            expect(
                screen.queryByRole('dialog', { name: 'Confirmar Eliminación' })
            ).not.toBeInTheDocument();
        });
    });
});
