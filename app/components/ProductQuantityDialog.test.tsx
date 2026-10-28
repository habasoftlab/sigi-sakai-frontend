import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductQuantityDialog } from './ProductQuantityDialog';
import { Producto } from '@/app/types/orders';

describe('ProductQuantityDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnConfirm = jest.fn();

    const mockProductPiece: Producto = {
        idProducto: 1,
        nombre: 'Flyers',
        descripcion: 'Flyer Publicitario 1/4 Carta',
        formatoTamano: 'Carta',
        unidadVenta: 'Pieza',
        precioUnitario: 2.5,
        precioPaquete: 200.0,
        cantidadPaquete: 100,
        tirajeMinimo: 50,
        tiempoProduccionDias: 1,
        volumenDescuentoCantidad: 500
    };

    const mockProductM2: Producto = {
        idProducto: 2,
        nombre: 'Lona',
        descripcion: 'Lona Impresa Gran Formato',
        formatoTamano: 'Personalizado',
        unidadVenta: 'm²',
        precioUnitario: 120.0,
        precioPaquete: 200.0,
        cantidadPaquete: 100,
        tirajeMinimo: 1,
        tiempoProduccionDias: 1,
        volumenDescuentoCantidad: 10
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe renderizar nada si el producto es nulo', () => {
        const { container } = render(
            <ProductQuantityDialog
                visible={true}
                product={null}
                onHide={mockOnHide}
                onConfirm={mockOnConfirm}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('debe precargar la cantidad con el tiraje mínimo del producto al estar visible', () => {
        render(
            <ProductQuantityDialog
                visible={true}
                product={mockProductPiece}
                onHide={mockOnHide}
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText('Flyer Publicitario 1/4 Carta')).toBeInTheDocument();
        expect(screen.getByText(/Mínimo requerido: 50 piezas/i)).toBeInTheDocument();

        // 50 piezas * $2.50 = $125.00
        expect(screen.getByText('$125.00')).toBeInTheDocument();
    });

    it('debe ajustar los textos y la etiqueta cuando el producto se vende por metros cuadrados (m²)', () => {
        render(
            <ProductQuantityDialog
                visible={true}
                product={mockProductM2}
                onHide={mockOnHide}
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText('Metros Cuadrados (m²):')).toBeInTheDocument();
        expect(screen.getByText(/Mínimo requerido: 1 m²/i)).toBeInTheDocument();
    });

    it('debe calcular la equivalencia en paquetes si la propiedad cantidadPaquete está presente', () => {
        render(
            <ProductQuantityDialog
                visible={true}
                product={mockProductPiece}
                onHide={mockOnHide}
                onConfirm={mockOnConfirm}
            />
        );

        // Tiraje mínimo = 50, Paquete = 100 -> 50/100 = 0.5 paquetes
        expect(screen.getByText('= 0.5 paquetes')).toBeInTheDocument();
    });

    it('debe invocar onConfirm con el producto y la cantidad seleccionada al hacer clic en "Agregar a la Orden"', () => {
        render(
            <ProductQuantityDialog
                visible={true}
                product={mockProductPiece}
                onHide={mockOnHide}
                onConfirm={mockOnConfirm}
            />
        );

        const agregarBtn = screen.getByRole('button', { name: /Agregar a la Orden/i });
        fireEvent.click(agregarBtn);

        expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPiece, 50);
        expect(mockOnHide).toHaveBeenCalled();
    });

    it('debe llamar a onHide al presionar el botón Cancelar', () => {
        render(
            <ProductQuantityDialog
                visible={true}
                product={mockProductPiece}
                onHide={mockOnHide}
                onConfirm={mockOnConfirm}
            />
        );

        const cancelarBtn = screen.getByRole('button', { name: /Cancelar/i });
        fireEvent.click(cancelarBtn);

        expect(mockOnHide).toHaveBeenCalled();
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });
});