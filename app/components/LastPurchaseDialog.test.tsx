import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UltimaCompraDialog } from './LastPurchaseDialog';
import { ClientService } from '@/app/service/clientService';
import { OrderService } from '@/app/service/orderService';
import { CatalogService } from '@/app/service/catalogService';

jest.mock('@/app/service/clientService');
jest.mock('@/app/service/orderService');
jest.mock('@/app/service/catalogService');

const mockClientService = ClientService as jest.Mocked<typeof ClientService>;
const mockOrderService = OrderService as jest.Mocked<typeof OrderService>;
const mockCatalogService = CatalogService as jest.Mocked<typeof CatalogService>;

describe('UltimaCompraDialog Component', () => {
    const mockOnHide = jest.fn();

    const mockUltimaCompraDTO = {
        idCliente: 1,
        nombre: 'Juan Pérez',
        rfc: 'PEPJ800101XXX',
        telefono: '2711112233',
        idUltimaOrden: 501,
        fechaUltimaCompra: '2026-10-18T04:00:00.000Z'
    };

    const mockOrdenDTO = {
        idOrden: 501,
        montoTotal: 1500.0,
        detalles: [
            {
                idDetalle: 1,
                idProducto: 10,
                cantidad: 2,
                importe: 1500.0
            }
        ]
    };

    const mockProductos = [
        {
            idProducto: 10,
            nombre: 'Impresión Lona 13oz',
            unidadVenta: 'm2'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockCatalogService.getProductos.mockResolvedValue(mockProductos as any);
    });

    it('no debe renderizar el diálogo cuando visible es false', () => {
        render(
            <UltimaCompraDialog
                visible={false}
                idCliente={1}
                onHide={mockOnHide}
            />
        );

        expect(screen.queryByText(/Detalles de la ultima compra/i)).not.toBeInTheDocument();
    });

    it('debe cargar y mostrar los detalles de la última compra correctamente', async () => {
        mockClientService.getUltimaCompra.mockResolvedValueOnce(mockUltimaCompraDTO as any);
        mockOrderService.getOrdenById.mockResolvedValueOnce(mockOrdenDTO as any);

        render(
            <UltimaCompraDialog
                visible={true}
                idCliente={1}
                onHide={mockOnHide}
            />
        );

        await waitFor(() => {
            expect(mockClientService.getUltimaCompra).toHaveBeenCalledWith(1);
            expect(mockOrderService.getOrdenById).toHaveBeenCalledWith(501);
            expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
            expect(screen.getByText('Impresión Lona 13oz')).toBeInTheDocument();
            expect(screen.getByText('2 m2')).toBeInTheDocument();
            expect(screen.getAllByText(/\$1500\.00/).length).toBeGreaterThan(0);
        });
    });

    it('debe mostrar el mensaje "Sin historial de compras" cuando idUltimaOrden es nulo o indefinido', async () => {
        const mockSinCompra = {
            ...mockUltimaCompraDTO,
            idUltimaOrden: null,
            fechaUltimaCompra: null
        };

        mockClientService.getUltimaCompra.mockResolvedValueOnce(mockSinCompra as any);

        render(
            <UltimaCompraDialog
                visible={true}
                idCliente={1}
                onHide={mockOnHide}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Sin historial de compras')).toBeInTheDocument();
            expect(screen.getByText('Este cliente aún no registra órdenes en el sistema.')).toBeInTheDocument();
        });

        expect(mockOrderService.getOrdenById).not.toHaveBeenCalled();
    });
});