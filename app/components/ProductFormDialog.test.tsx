import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductFormDialog } from './ProductFormDialog';
import { CatalogService } from '@/app/service/catalogService';
import { Producto } from '@/app/types/orders';

jest.mock('@/app/service/catalogService');
jest.mock('primereact/inputnumber', () => ({
    InputNumber: ({
        value,
        onValueChange,
        id,
        className,
        disabled,
        placeholder
    }: any) => (
        <input
            id={id}
            className={className}
            disabled={disabled}
            placeholder={placeholder}
            value={value ?? ''}
            onChange={(e) =>
                onValueChange?.({
                    value: e.target.value === '' ? null : Number(e.target.value)
                })
            }
        />
    )
}));

const mockCatalogService = CatalogService as jest.Mocked<typeof CatalogService>;

describe('ProductFormDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnSuccess = jest.fn();

    const mockProductToEdit: Producto = {
        idProducto: 10,
        nombre: 'Tarjetas',
        descripcion: 'Tarjetas básicas couché 300g',
        precioUnitario: 150.0,
        precioPaquete: 1200.0,
        cantidadPaquete: 1000,
        tiempoProduccionDias: 2,
        formatoTamano: '9x5 cm',
        unidadVenta: 'Millar',
        tirajeMinimo: 1000,
        volumenDescuentoCantidad: 5000
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe renderizar el diálogo cuando visible es false', () => {
        render(
            <ProductFormDialog
                visible={false}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={null}
            />
        );

        expect(screen.queryByText('Nuevo Producto')).not.toBeInTheDocument();
    });

    it('debe mostrar el título "Nuevo Producto" y los campos limpios en modo creación', () => {
        render(
            <ProductFormDialog
                visible={true}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={null}
            />
        );

        expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
        const descInput = screen.getByPlaceholderText(/Ej. Tarjetas básicas/i) as HTMLInputElement;
        expect(descInput.value).toBe('');
    });

    it('debe validar que la descripción y el precio unitario sean obligatorios al guardar', async () => {
        render(
            <ProductFormDialog
                visible={true}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={null}
            />
        );

        const guardarBtn = screen.getByRole('button', { name: /Guardar/i });
        fireEvent.click(guardarBtn);

        expect(await screen.findByText('La descripción es obligatoria.')).toBeInTheDocument();
        expect(await screen.findByText('El precio debe ser mayor a 0.')).toBeInTheDocument();
        expect(mockCatalogService.createProducto).not.toHaveBeenCalled();
    });

    it('debe crear un producto correctamente al enviar datos válidos', async () => {
        mockCatalogService.createProducto.mockResolvedValueOnce({} as any);

        render(
            <ProductFormDialog
                visible={true}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={null}
            />
        );

        fireEvent.change(
            screen.getByPlaceholderText(/ej\. tarjetas básicas/i),
            { target: { value: 'Lona impresa 13oz' } }
        );

        fireEvent.change(screen.getByLabelText(/precio unitario/i), {
            target: { value: '250' }
        });

        fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

        await waitFor(() => {
            expect(mockCatalogService.createProducto).toHaveBeenCalledWith(
                expect.objectContaining({
                    descripcion: 'Lona impresa 13oz',
                    precioUnitario: 250
                })
            );
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('debe precargar los datos y llamar a updateProducto en modo edición', async () => {
        mockCatalogService.updateProducto.mockResolvedValueOnce({} as any);

        render(
            <ProductFormDialog
                visible={true}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={mockProductToEdit}
            />
        );

        expect(screen.getByText('Editar Producto')).toBeInTheDocument();

        const descInput = screen.getByPlaceholderText(/Ej. Tarjetas básicas/i) as HTMLInputElement;
        expect(descInput.value).toBe('Tarjetas básicas couché 300g');

        fireEvent.change(descInput, { target: { value: 'Tarjetas Premium Matte' } });

        const guardarBtn = screen.getByRole('button', { name: /Guardar/i });
        fireEvent.click(guardarBtn);

        await waitFor(() => {
            expect(mockCatalogService.updateProducto).toHaveBeenCalledWith(
                10,
                expect.objectContaining({
                    idProducto: 10,
                    descripcion: 'Tarjetas Premium Matte'
                })
            );
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('debe deshabilitar los botones mientras se procesa la solicitud', async () => {
        let resolveCreate!: (value: any) => void;

        mockCatalogService.createProducto.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveCreate = resolve;
                })
        );

        render(
            <ProductFormDialog
                visible={true}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={null}
            />
        );

        fireEvent.change(
            screen.getByPlaceholderText(/ej\. tarjetas básicas/i),
            { target: { value: 'Volantes Offset' } }
        );
        fireEvent.change(screen.getByLabelText(/precio unitario/i), {
            target: { value: '500' }
        });
        fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
        await waitFor(() => {
            expect(mockCatalogService.createProducto).toHaveBeenCalled();
        });
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
        resolveCreate({});
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /cancelar/i })).toBeEnabled();
        });
    });

    it('debe llamar a onHide al hacer clic en Cancelar', () => {
        render(
            <ProductFormDialog
                visible={true}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
                productToEdit={null}
            />
        );

        const cancelarBtn = screen.getByRole('button', { name: /Cancelar/i });
        fireEvent.click(cancelarBtn);

        expect(mockOnHide).toHaveBeenCalled();
    });
});