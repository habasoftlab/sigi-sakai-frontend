import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteSummaryDialog } from './QuoteSummaryDialog';
import { Client } from '@/app/types/clients';
jest.mock('primereact/dropdown', () => ({
    Dropdown: ({ inputId, value, onChange, options }: any) => (
        <select
            id={inputId}
            aria-label="Asignar a Diseñador"
            value={value ?? ''}
            onChange={(event) =>
                onChange({
                    value: event.target.value === ''
                        ? null
                        : Number(event.target.value),
                })
            }
        >
            <option value="">Seleccionar Diseñador</option>
            {options.map((option: any) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    ),
}));

jest.mock('primereact/checkbox', () => ({
    Checkbox: ({ inputId, checked, onChange, disabled }: any) => (
        <input
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange({ checked: event.target.checked })}
        />
    ),
}));

describe('QuoteSummaryDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnAssignClient = jest.fn();
    const mockOnNewClient = jest.fn();
    const mockOnSelectDesigner = jest.fn();
    const mockOnToggleBilling = jest.fn();
    const mockOnConfirm = jest.fn();

    const mockItems = [
        { idProducto: 1, descripcion: 'Pendón Publicitario', cantidad: 2, importe: 800.0 }
    ];

    const mockClientWithRfc: Client = {
        id: 1,
        nombre: 'Comercializadora MX',
        email: 'comercial@test.com',
        telefono: '2710000000',
        rfc: 'CMX800101XXX',
        razonSocial: 'Comercializadora MX SA',
        direccionFiscal: 'Av. Hidalgo 10',
        idUsoCfdi: 1,
        idRegimenFiscal: 601
    };

    const mockClientWithoutRfc: Client = {
        id: 2,
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        telefono: '2710000000',
        rfc: '',
        razonSocial: '',
        direccionFiscal: '',
        idUsoCfdi: null,
        idRegimenFiscal: null
    };

    const mockDesigners = [
        { label: 'Carlos Diseñador', value: 10 }
    ];

    const defaultProps = {
        visible: true,
        onHide: mockOnHide,
        items: mockItems,
        total: 800.0,
        productionTime: 3,
        assignedClient: null,
        onAssignClient: mockOnAssignClient,
        onNewClient: mockOnNewClient,
        designers: mockDesigners,
        selectedDesigner: null,
        onSelectDesigner: mockOnSelectDesigner,
        requiresBilling: false,
        onToggleBilling: mockOnToggleBilling,
        onConfirm: mockOnConfirm
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe renderizar el diálogo cuando visible es false', () => {
        render(<QuoteSummaryDialog {...defaultProps} visible={false} />);
        expect(screen.queryByText('Confirmar Nueva Cotización')).not.toBeInTheDocument();
    });

    it('debe mostrar los productos, el total y el tiempo estimado de producción', () => {
        render(<QuoteSummaryDialog {...defaultProps} />);

        expect(screen.getByText('Confirmar Nueva Cotización')).toBeInTheDocument();
        expect(screen.getByText('Pendón Publicitario')).toBeInTheDocument();
        expect(screen.getByText('2 u')).toBeInTheDocument();

        // Manejo de múltiples coincidencias ($800.00 en celda e importe total)
        const totalElements = screen.getAllByText('$800.00');
        expect(totalElements.length).toBeGreaterThan(1);
        expect(screen.getByText(/Producción estimada: 3 días hábiles/i)).toBeInTheDocument();
    });

    it('debe solicitar la asignación de un cliente y deshabilitar "Crear Cotización" si no hay cliente', () => {
        render(<QuoteSummaryDialog {...defaultProps} assignedClient={null} />);

        expect(screen.getByText('Se requiere un cliente')).toBeInTheDocument();

        const buscarBtn = screen.getByRole('button', { name: /Buscar Cliente/i });
        fireEvent.click(buscarBtn);
        expect(mockOnAssignClient).toHaveBeenCalled();

        const crearBtn = screen.getByRole('button', { name: /Crear Cotización/i });
        expect(crearBtn).toBeDisabled();
    });

    it('debe mostrar los datos del cliente asignado y permitir la creación de la cotización', () => {
        render(<QuoteSummaryDialog {...defaultProps} assignedClient={mockClientWithRfc} />);

        expect(screen.getByText('Comercializadora MX')).toBeInTheDocument();
        expect(screen.getByText('CMX800101XXX')).toBeInTheDocument();

        const crearBtn = screen.getByRole('button', { name: /Crear Cotización/i });
        expect(crearBtn).not.toBeDisabled();

        fireEvent.click(crearBtn);
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('debe mostrar advertencia de "Cliente sin RFC" y deshabilitar facturación si el cliente no posee RFC', () => {
        render(<QuoteSummaryDialog {...defaultProps} assignedClient={mockClientWithoutRfc} />);

        expect(screen.getByText('Cliente sin RFC')).toBeInTheDocument();
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeDisabled();
    });

    it('debe llamar a onNewClient al hacer clic en Nuevo Cliente', () => {
        render(<QuoteSummaryDialog {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Nuevo Cliente/i }));

        expect(mockOnNewClient).toHaveBeenCalledTimes(1);
    });

    it('debe permitir cambiar el cliente asignado', () => {
        render(
            <QuoteSummaryDialog
                {...defaultProps}
                assignedClient={mockClientWithRfc}
            />
        );

        const changeClientButton = document.querySelector('.pi-pencil')?.closest('button');

        expect(changeClientButton).not.toBeNull();

        fireEvent.click(changeClientButton!);

        expect(mockOnAssignClient).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a onSelectDesigner al seleccionar un diseñador', () => {
        render(<QuoteSummaryDialog {...defaultProps} />);

        fireEvent.change(screen.getByRole('combobox', { name: /Asignar a Diseñador/i }), {
            target: { value: '10' },
        });

        expect(mockOnSelectDesigner).toHaveBeenCalledWith(10);
    });

    it('debe permitir limpiar el diseñador seleccionado', () => {
        render(
            <QuoteSummaryDialog
                {...defaultProps}
                selectedDesigner={10}
            />
        );

        fireEvent.change(screen.getByRole('combobox', { name: /Asignar a Diseñador/i }), {
            target: { value: '' },
        });

        expect(mockOnSelectDesigner).toHaveBeenCalledWith(null);
    });

    it('debe activar la facturación al marcar el checkbox', () => {
        render(
            <QuoteSummaryDialog
                {...defaultProps}
                assignedClient={mockClientWithRfc}
            />
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(mockOnToggleBilling).toHaveBeenCalledWith(true);
    });

    it('debe desactivar la facturación al desmarcar el checkbox', () => {
        render(
            <QuoteSummaryDialog
                {...defaultProps}
                assignedClient={mockClientWithRfc}
                requiresBilling={true}
            />
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(mockOnToggleBilling).toHaveBeenCalledWith(false);
    });

    it('debe mostrar la advertencia cuando el RFC no está definido', () => {
        render(
            <QuoteSummaryDialog
                {...defaultProps}
                assignedClient={{
                    ...mockClientWithRfc,
                    rfc: undefined as unknown as string,
                }}
            />
        );

        expect(screen.getByText('Sin RFC')).toBeInTheDocument();
        expect(screen.getByText('Cliente sin RFC')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeDisabled();
    });

});