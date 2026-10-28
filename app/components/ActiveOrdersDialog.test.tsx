import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveOrdersDialog } from './ActiveOrdersDialog';
import { Client } from '@/app/types/clients';

describe('ActiveOrdersDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnPage = jest.fn();
    const mockOnRowToggle = jest.fn();
    const mockOnQuickPay = jest.fn();

    const mockClients: Client[] = [
        {
            id: 1,
            nombre: 'Cliente Uno',
            email: 'uno@test.com',
            telefono: '2710000000',
            rfc: '',
            razonSocial: '',
            direccionFiscal: '',
            idUsoCfdi: null,
            idRegimenFiscal: null
        }
    ];

    const mockOrders = [
        {
            idOrden: 101,
            fechaCreacion: '2026-10-18T10:00:00Z',
            idCliente: 1,
            montoTotal: 1200.0,
            saldoPendiente: 800.0,
            nombreDisenador: 'Diseñador Principal'
        },
        {
            idOrden: 102,
            fechaCreacion: '2026-10-18T11:00:00Z',
            idCliente: 99,
            montoTotal: 500.0,
            saldoPendiente: 0.0,
            nombreDisenador: 'Diseñador Principal'
        }
    ];

    const defaultLazyParams = { first: 0, rows: 5, page: 0 };

    const defaultProps = {
        visible: true,
        onHide: mockOnHide,
        orders: mockOrders,
        clients: mockClients,
        loading: false,
        totalRecords: 2,
        lazyParams: defaultLazyParams,
        onPage: mockOnPage,
        expandedRows: mockOrders, // Pasamos las órdenes para asegurar el despliegue de las filas agrupadas
        onRowToggle: mockOnRowToggle,
        onQuickPay: mockOnQuickPay
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe renderizar el diálogo cuando visible es false', () => {
        render(<ActiveOrdersDialog {...defaultProps} visible={false} />);

        expect(screen.queryByText('Lista de Órdenes en Curso')).not.toBeInTheDocument();
    });

    it('debe mostrar el título y los datos de las órdenes cuando visible es true', () => {
        render(<ActiveOrdersDialog {...defaultProps} />);

        expect(screen.getByText('Lista de Órdenes en Curso')).toBeInTheDocument();
        expect(screen.getByText('101')).toBeInTheDocument();
        expect(screen.getByText('102')).toBeInTheDocument();
        expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
        expect(screen.getByText('Público General')).toBeInTheDocument();
    });

    it('debe calcular correctamente el saldo y mostrar el botón "Abonar" cuando hay saldo pendiente', () => {
        render(<ActiveOrdersDialog {...defaultProps} orders={[mockOrders[0]]} expandedRows={[mockOrders[0]]} />);

        expect(screen.getByText('$800.00')).toBeInTheDocument();

        const abonarBtn = screen.getByRole('button', { name: /Abonar/i });
        expect(abonarBtn).toBeInTheDocument();

        fireEvent.click(abonarBtn);
        expect(mockOnQuickPay).toHaveBeenCalledWith(mockOrders[0]);
    });

    it('debe mostrar la etiqueta "Pagado" cuando el saldo pendiente es 0', () => {
        render(<ActiveOrdersDialog {...defaultProps} orders={[mockOrders[1]]} expandedRows={[mockOrders[1]]} />);

        expect(screen.getByText('$0.00')).toBeInTheDocument();
        expect(screen.getByText('Pagado')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Abonar/i })).not.toBeInTheDocument();
    });

    it('debe calcular el saldo dinámicamente si saldoPendiente es undefined', () => {
        const orderWithoutSaldo = {
            idOrden: 103,
            fechaCreacion: '2026-10-18T10:00:00Z',
            idCliente: 1,
            montoTotal: 1200.0,
            montoPagado: 400.0,
            saldoPendiente: undefined,
            nombreDisenador: 'Diseñador Principal'
        };

        render(<ActiveOrdersDialog {...defaultProps} orders={[orderWithoutSaldo]} expandedRows={[orderWithoutSaldo]} />);

        // $1200.00 - $400.00 = $800.00
        expect(screen.getByText('$800.00')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Abonar/i })).toBeInTheDocument();
    });
});