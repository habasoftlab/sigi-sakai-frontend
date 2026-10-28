import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientSearchDialog } from './ClientSearchDialog';
import { Client } from '@/app/types/clients';

describe('ClientSearchDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnSelect = jest.fn();

    const mockClients: Client[] = [
        {
            id: 1,
            nombre: 'Juan Pérez',
            email: 'juan@empresa.com',
            telefono: '2710000000',
            rfc: 'JUAP800101XXX',
            razonSocial: 'Juan Pérez SA',
            direccionFiscal: 'Av. Siempre Viva 123',
            idUsoCfdi: 1,
            idRegimenFiscal: 601
        },
        {
            id: 2,
            nombre: 'María Gómez',
            email: 'maria@empresa.com',
            telefono: '2711111111',
            rfc: 'MAGO900202YYY',
            razonSocial: 'María Gómez EIRL',
            direccionFiscal: 'Calle 5 de Mayo 45',
            idUsoCfdi: 2,
            idRegimenFiscal: 612
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe renderizar el diálogo cuando visible es false', () => {
        render(
            <ClientSearchDialog
                visible={false}
                clients={mockClients}
                onHide={mockOnHide}
                onSelect={mockOnSelect}
            />
        );

        expect(screen.queryByText('Asignar Cliente')).not.toBeInTheDocument();
    });

    it('debe mostrar la lista de clientes y deshabilitar el botón Seleccionar de inicio', () => {
        render(
            <ClientSearchDialog
                visible={true}
                clients={mockClients}
                onHide={mockOnHide}
                onSelect={mockOnSelect}
            />
        );

        expect(screen.getByText('Asignar Cliente')).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María Gómez')).toBeInTheDocument();

        const seleccionarBtn = screen.getByRole('button', { name: /Seleccionar/i });
        expect(seleccionarBtn).toBeDisabled();
    });

    it('debe actualizar el filtro de búsqueda al escribir en el campo de texto', () => {
        render(
            <ClientSearchDialog
                visible={true}
                clients={mockClients}
                onHide={mockOnHide}
                onSelect={mockOnSelect}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Buscar por nombre, correo o RFC.../i) as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: 'María' } });

        expect(searchInput.value).toBe('María');
    });

    it('debe seleccionar un cliente y llamar a onSelect y onHide al hacer clic en Seleccionar', () => {
        render(
            <ClientSearchDialog
                visible={true}
                clients={mockClients}
                onHide={mockOnHide}
                onSelect={mockOnSelect}
            />
        );

        // Seleccionar la fila correspondiente a Juan Pérez
        const row = screen.getByText('Juan Pérez').closest('tr');
        expect(row).not.toBeNull();
        fireEvent.click(row!);

        const seleccionarBtn = screen.getByRole('button', { name: /Seleccionar/i });
        expect(seleccionarBtn).not.toBeDisabled();

        fireEvent.click(seleccionarBtn);

        expect(mockOnSelect).toHaveBeenCalledWith(mockClients[0]);
        expect(mockOnHide).toHaveBeenCalled();
    });

    it('debe llamar a onHide al presionar el botón Cancelar', () => {
        render(
            <ClientSearchDialog
                visible={true}
                clients={mockClients}
                onHide={mockOnHide}
                onSelect={mockOnSelect}
            />
        );

        const cancelarBtn = screen.getByRole('button', { name: /Cancelar/i });
        fireEvent.click(cancelarBtn);

        expect(mockOnHide).toHaveBeenCalled();
        expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('debe mostrar mensaje vacío cuando no hay clientes que coincidan', () => {
        render(
            <ClientSearchDialog
                visible={true}
                clients={[]}
                onHide={mockOnHide}
                onSelect={mockOnSelect}
            />
        );

        expect(screen.getByText('No se encontraron clientes.')).toBeInTheDocument();
    });
});