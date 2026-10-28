import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ClientFormDialog } from './ClientFormDialog';
import { ClientService } from '@/app/service/clientService';
import { CatalogService } from '@/app/service/catalogService';
import { Client } from '@/app/types/clients';

jest.mock('@/app/service/clientService');
jest.mock('@/app/service/catalogService');

const mockClientService = ClientService as jest.Mocked<typeof ClientService>;
const mockCatalogService = CatalogService as jest.Mocked<typeof CatalogService>;

describe('ClientFormDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnSuccess = jest.fn();

    const mockRegimenes = [
        { idRegimen: 601, clave: '601', descripcion: 'General de Ley Personas Morales' }
    ];
    const mockUsos = [
        { idUsoCfdi: 1, clave: 'G03', descripcion: 'Gastos en general' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockCatalogService.getRegimenesFiscales.mockResolvedValue(mockRegimenes as any);
        mockCatalogService.getUsosCfdi.mockResolvedValue(mockUsos as any);
    });

    it('no debe renderizar el contenido cuando visible es false', () => {
        render(
            <ClientFormDialog
                visible={false}
                onHide={mockOnHide}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.queryByText('Nuevo Cliente')).not.toBeInTheDocument();
    });

    it('debe cargar las opciones de régimen fiscal y uso CFDI al abrir', async () => {
        await act(async () => {
            render(
                <ClientFormDialog
                    visible={true}
                    onHide={mockOnHide}
                    onSuccess={mockOnSuccess}
                    clientToEdit={null}
                />
            );
        });

        await waitFor(() => {
            expect(mockCatalogService.getRegimenesFiscales).toHaveBeenCalled();
            expect(mockCatalogService.getUsosCfdi).toHaveBeenCalled();
        });
    });

    it('debe mostrar mensaje de validación si el nombre está vacío al guardar', async () => {
        await act(async () => {
            render(
                <ClientFormDialog
                    visible={true}
                    onHide={mockOnHide}
                    onSuccess={mockOnSuccess}
                    clientToEdit={null}
                />
            );
        });

        const guardarBtn = screen.getByText('Guardar');
        fireEvent.click(guardarBtn);

        expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
        expect(mockClientService.create).not.toHaveBeenCalled();
    });

    it('debe crear un nuevo cliente con éxito al enviar datos válidos', async () => {
        const createdResponse = {
            id: 50,
            nombre: 'Empresa Test',
            email: 'contacto@empresa.com',
            telefono: '2710000000',
            rfc: 'XAXX010101000',
            razonSocial: 'Empresa Test SA',
            direccionFiscal: 'Av Central 1',
            idUsoCfdi: 1,
            idRegimenFiscal: 601
        };

        mockClientService.create.mockResolvedValue(createdResponse as any);

        await act(async () => {
            render(
                <ClientFormDialog
                    visible={true}
                    onHide={mockOnHide}
                    onSuccess={mockOnSuccess}
                    clientToEdit={null}
                />
            );
        });

        const nombreInput = screen.getByLabelText(/Nombre \/ Razón Social\*/i);
        fireEvent.change(nombreInput, { target: { value: 'Empresa Test' } });

        const guardarBtn = screen.getByText('Guardar');
        fireEvent.click(guardarBtn);

        await waitFor(() => {
            expect(mockClientService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: 'Empresa Test'
                })
            );
            expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({
                id: 50,
                nombre: 'Empresa Test'
            }));
            expect(mockOnHide).toHaveBeenCalled();
        });
    });

    it('debe precargar datos y llamar a ClientService.update al estar en modo edición', async () => {
        const clientToEdit: Client = {
            id: 10,
            nombre: 'Cliente Existente',
            email: 'existente@test.com',
            telefono: '2711111111',
            rfc: 'RFC123456789',
            razonSocial: 'Razon Social Test',
            direccionFiscal: 'Direccion 123',
            idUsoCfdi: 1,
            idRegimenFiscal: 601
        };

        mockClientService.update.mockResolvedValue({} as any);

        await act(async () => {
            render(
                <ClientFormDialog
                    visible={true}
                    onHide={mockOnHide}
                    onSuccess={mockOnSuccess}
                    clientToEdit={clientToEdit}
                />
            );
        });

        expect(screen.getByText('Editar Cliente')).toBeInTheDocument();

        const nombreInput = screen.getByLabelText(/Nombre \/ Razón Social\*/i) as HTMLInputElement;
        expect(nombreInput.value).toBe('Cliente Existente');

        fireEvent.change(nombreInput, { target: { value: 'Cliente Actualizado' } });

        const guardarBtn = screen.getByText('Guardar');
        fireEvent.click(guardarBtn);

        await waitFor(() => {
            expect(mockClientService.update).toHaveBeenCalledWith(
                10,
                expect.objectContaining({
                    nombre: 'Cliente Actualizado'
                })
            );
            expect(mockOnSuccess).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 10,
                    nombre: 'Cliente Actualizado'
                })
            );
            expect(mockOnHide).toHaveBeenCalled();
        });
    });

    it('debe llamar a onHide al hacer clic en el botón Cancelar', async () => {
        await act(async () => {
            render(
                <ClientFormDialog
                    visible={true}
                    onHide={mockOnHide}
                    onSuccess={mockOnSuccess}
                />
            );
        });

        const cancelarBtn = screen.getByText('Cancelar');
        fireEvent.click(cancelarBtn);

        expect(mockOnHide).toHaveBeenCalled();
    });
});