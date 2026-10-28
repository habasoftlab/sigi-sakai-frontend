import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteListDialog } from './QuoteListDialog';
import { Client } from '@/app/types/clients';

describe('QuoteListDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnPage = jest.fn();
    const mockOnRowToggle = jest.fn();
    const mockOnRetake = jest.fn();

    const mockClients: Client[] = [
        {
            id: 1,
            nombre: 'Empresa Alpha',
            email: 'alpha@test.com',
            telefono: '2710000000',
            rfc: 'EAL800101XXX',
            razonSocial: 'Empresa Alpha SA',
            direccionFiscal: 'Calle 1 #100',
            idUsoCfdi: 1,
            idRegimenFiscal: 601
        }
    ];

    const mockQuotes = [
        {
            idOrden: 201,
            fechaCreacion: '2026-10-18T10:00:00Z',
            idCliente: 1,
            montoTotal: 1800.5,
            nombreDisenador: 'Diseñador Principal'
        },
        {
            idOrden: 202,
            fechaCreacion: '2026-10-18T11:00:00Z',
            idCliente: 99,
            montoTotal: 450.0,
            nombreDisenador: 'Diseñador Principal'
        }
    ];

    const defaultLazyParams = { first: 0, rows: 5, page: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe renderizar el contenido cuando visible es false', () => {
        render(
            <QuoteListDialog
                visible={false}
                onHide={mockOnHide}
                quotes={mockQuotes}
                clients={mockClients}
                loading={false}
                totalRecords={2}
                lazyParams={defaultLazyParams}
                onPage={mockOnPage}
                expandedRows={[]}
                onRowToggle={mockOnRowToggle}
                onRetake={mockOnRetake}
            />
        );

        expect(screen.queryByText('Lista de Cotizaciones')).not.toBeInTheDocument();
    });

    it('debe desplegar el título y renderizar el listado de cotizaciones', () => {
        render(
            <QuoteListDialog
                visible={true}
                onHide={mockOnHide}
                quotes={mockQuotes}
                clients={mockClients}
                loading={false}
                totalRecords={2}
                lazyParams={defaultLazyParams}
                onPage={mockOnPage}
                expandedRows={mockQuotes} // Pasar las filas para asegurar despliegue
                onRowToggle={mockOnRowToggle}
                onRetake={mockOnRetake}
            />
        );

        expect(screen.getByText('Lista de Cotizaciones')).toBeInTheDocument();
        expect(screen.getByText('#201')).toBeInTheDocument();
        expect(screen.getByText('#202')).toBeInTheDocument();
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
        expect(screen.getByText('Público General')).toBeInTheDocument();
    });

    it('debe ejecutar la función onRetake al hacer clic en el botón "Retomar"', () => {
        render(
            <QuoteListDialog
                visible={true}
                onHide={mockOnHide}
                quotes={[mockQuotes[0]]}
                clients={mockClients}
                loading={false}
                totalRecords={1}
                lazyParams={defaultLazyParams}
                onPage={mockOnPage}
                expandedRows={[mockQuotes[0]]}
                onRowToggle={mockOnRowToggle}
                onRetake={mockOnRetake}
            />
        );

        const retomarBtn = screen.getByText('Retomar').closest('button');
        expect(retomarBtn).toBeInTheDocument();

        fireEvent.click(retomarBtn!);
        expect(mockOnRetake).toHaveBeenCalledWith(mockQuotes[0]);
    });

    it('debe mostrar el mensaje por defecto cuando no existen cotizaciones', () => {
        render(
            <QuoteListDialog
                visible={true}
                onHide={mockOnHide}
                quotes={[]}
                clients={mockClients}
                loading={false}
                totalRecords={0}
                lazyParams={defaultLazyParams}
                onPage={mockOnPage}
                expandedRows={[]}
                onRowToggle={mockOnRowToggle}
                onRetake={mockOnRetake}
            />
        );

        expect(screen.getByText('No se encontraron cotizaciones.')).toBeInTheDocument();
    });
});