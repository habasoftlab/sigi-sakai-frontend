import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderPaymentDialog } from './OrderPaymentDialog';
jest.mock('primereact/fileupload', () => ({
    FileUpload: ({ onSelect, onRemove, onClear }: any) => (
        <div>
            <button
                type="button"
                onClick={() =>
                    onSelect({
                        files: [
                            new File(['contenido'], 'diseno.pdf', {
                                type: 'application/pdf',
                            }),
                        ],
                    })
                }
            >
                Seleccionar archivo de prueba
            </button>

            <button type="button" onClick={() => onRemove?.({})}>
                Eliminar archivo
            </button>

            <button type="button" onClick={() => onClear?.()}>
                Limpiar archivos
            </button>
        </div>
    ),
}));

jest.mock('primereact/inputnumber', () => ({
    InputNumber: ({
        value,
        onValueChange,
        inputId,
        minFractionDigits,
        maxFractionDigits,
        inputStyle,
        mode,
        currency,
        locale,
        ...props
    }: any) => (
        <input
            {...props}
            id={inputId}
            type="number"
            value={value ?? ''}
            onChange={(event) =>
                onValueChange?.({
                    value:
                        event.target.value === ''
                            ? null
                            : Number(event.target.value),
                })
            }
        />
    ),
}));

describe('OrderPaymentDialog Component', () => {
    const mockOnHide = jest.fn();
    const mockOnConfirmPayment = jest.fn();
    const mockOnNotesChange = jest.fn();

    const mockItems = [
        { descripcion: 'Tarjeta de Presentación', cantidad: 1000, costo: 0.5, importe: 500.0 }
    ];

    const mockPaymentConditions = [
        { idCondicion: 1, numeroPlazos: 1, descripcion: 'Contado 100%' },
        { idCondicion: 2, numeroPlazos: 2, descripcion: 'Anticipo 20%' },
        { idCondicion: 3, numeroPlazos: 3, descripcion: '3 Pagos' }
    ];

    const defaultProps = {
        visible: true,
        onHide: mockOnHide,
        orderId: 101,
        items: mockItems,
        total: 1000.0,
        paidAmount: 0.0,
        currentConditionId: 1,
        paymentConditions: mockPaymentConditions,
        onConfirmPayment: mockOnConfirmPayment,
        isSubmitting: false,
        notes: '',
        onNotesChange: mockOnNotesChange
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('no debe mostrar el diálogo cuando visible es false', () => {
        render(<OrderPaymentDialog {...defaultProps} visible={false} />);
        expect(screen.queryByText(/Resumen de la orden #101/i)).not.toBeInTheDocument();
    });

    it('debe mostrar el resumen de la orden y calcular el monto total', () => {
        render(<OrderPaymentDialog {...defaultProps} />);

        expect(screen.getByText(/Resumen de la orden #101/i)).toBeInTheDocument();
        expect(screen.getByText('Tarjeta de Presentación')).toBeInTheDocument();

        const totalElements = screen.getAllByText(/\$1000\.00/i);
        expect(totalElements.length).toBeGreaterThan(0);
    });

    it('debe cambiar el tipo de pago a Anticipo (50%) al hacer clic en el botón rápido', () => {
        render(<OrderPaymentDialog {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /anticipo/i }));

        const inputCobrar = screen.getByPlaceholderText('0.00') as HTMLInputElement;

        expect(inputCobrar.value).toBe('500');
    });

    it('debe calcular correctamente los plazos cuando la orden es mayor a $3000', () => {
        render(<OrderPaymentDialog {...defaultProps} total={3000} />);

        const plazosBtn = screen.getByRole('button', {
            name: /Plazos \(3 Pagos\)/i,
        });

        fireEvent.click(plazosBtn);

        const inputCobrar = screen.getByPlaceholderText('0.00');

        expect(inputCobrar).toHaveValue(1000);
    });

    it('debe llamar a onNotesChange al escribir en las notas de diseño', () => {
        render(<OrderPaymentDialog {...defaultProps} />);

        const textarea = screen.getByPlaceholderText(/Escribe aquí las instrucciones detalladas/i);
        fireEvent.change(textarea, { target: { value: 'Usar pantone 286 C' } });

        expect(mockOnNotesChange).toHaveBeenCalledWith('Usar pantone 286 C');
    });

    it('debe enviar la estructura PaymentData correcta al confirmar el pago', () => {
        render(<OrderPaymentDialog {...defaultProps} />);

        const refInput = screen.getByPlaceholderText('Efevo / Transf / #Recibo');
        fireEvent.change(refInput, { target: { value: 'TRANSF-987' } });

        const confirmBtn = screen.getByRole('button', { name: /Confirmar Pago y Guardar/i });
        fireEvent.click(confirmBtn);

        expect(mockOnConfirmPayment).toHaveBeenCalledWith({
            amount: 1000.0,
            paymentType: 'unico',
            notes: 'TRANSF-987',
            conditionId: 1,
            file: null
        });
    });

    it('debe deshabilitar el botón de confirmación si el monto es 0 o excede el saldo', () => {
        render(<OrderPaymentDialog {...defaultProps} paidAmount={1000.0} />);

        const confirmBtn = screen.getByRole('button', { name: /Confirmar Pago y Guardar/i });
        expect(confirmBtn).toBeDisabled();
    });

    it('debe calcular el saldo pendiente al seleccionar pago total', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={1500}
                paidAmount={400}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Pago Total \(Liquidar\)/i })
        );

        expect(screen.getByText('$1100.00')).toBeInTheDocument();
    });

    it('debe calcular el anticipo sugerido cuando ya se ha abonado al menos el 19%', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={1000}
                paidAmount={200}
                currentConditionId={2}
            />
        );

        expect(screen.getByPlaceholderText('0.00')).toHaveValue(800);
    });

    it('debe calcular el anticipo del 50% cuando el abono anterior es menor al 19%', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={1000}
                paidAmount={100}
                currentConditionId={2}
            />
        );

        expect(screen.getByPlaceholderText('0.00')).toHaveValue(500);
    });

    it('debe calcular los plazos iniciales para la condición 3', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={3000}
                paidAmount={0}
                currentConditionId={3}
            />
        );

        expect(screen.getByPlaceholderText('0.00')).toHaveValue(1000);
    });

    it('debe calcular los plazos iniciales para la condición 4', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={2000}
                paidAmount={0}
                currentConditionId={4}
            />
        );

        expect(screen.getByPlaceholderText('0.00')).toHaveValue(1000);
    });

    it('debe limitar el monto de los plazos al saldo pendiente', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={3000}
                paidAmount={2500}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Plazos \(3 Pagos\)/i })
        );

        expect(screen.getByPlaceholderText('0.00')).toHaveValue(500);
    });

    it('debe deshabilitar la opción de plazos para órdenes menores a $1000', () => {
        render(<OrderPaymentDialog {...defaultProps} total={999} />);

        expect(
            screen.getByRole('button', { name: /Plazos \(2 Pagos\)/i })
        ).toBeDisabled();
    });

    it('debe mostrar el encabezado de abono cuando no hay productos', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                items={[]}
                orderId={25}
            />
        );

        expect(screen.getByText('Abonar orden #25')).toBeInTheDocument();
    });

    it('debe mostrar el saldo pendiente y el abono anterior', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={2000}
                paidAmount={500}
            />
        );

        expect(screen.getByText('-$500.00')).toBeInTheDocument();
        expect(screen.getByText('$1500.00')).toBeInTheDocument();
    });

    it('debe usar la condición de dos plazos como alternativa para el anticipo', () => {
        const conditions = [
            { idCondicion: 8, numeroPlazos: 2, descripcion: 'Pago diferido' },
        ];

        render(
            <OrderPaymentDialog
                {...defaultProps}
                paymentConditions={conditions}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Anticipo \(50%\)/i })
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        );

        expect(mockOnConfirmPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentType: 'anticipo',
                conditionId: 8,
            })
        );
    });

    it('debe usar la condición 1 cuando no existe una condición de contado', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                paymentConditions={[]}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        );

        expect(mockOnConfirmPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentType: 'unico',
                conditionId: 1,
            })
        );
    });

    it('debe usar la condición de dos plazos como alternativa para el anticipo si no hay descripción 20%', () => {
        const conditions = [
            { idCondicion: 7, numeroPlazos: 2, descripcion: 'Dos pagos' },
        ];

        render(
            <OrderPaymentDialog
                {...defaultProps}
                paymentConditions={conditions}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Anticipo \(50%\)/i })
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        );

        expect(mockOnConfirmPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                conditionId: 7,
                paymentType: 'anticipo',
            })
        );
    });

    it('debe usar tres plazos cuando el total es de al menos $3000', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={3000}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Plazos \(3 Pagos\)/i })
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        );

        expect(mockOnConfirmPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentType: 'plazos',
                conditionId: 3,
            })
        );
    });

    it('debe mostrar el botón de confirmación en estado de carga', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                isSubmitting={true}
            />
        );

        expect(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        ).toBeDisabled();
    });

    it('debe mostrar una advertencia cuando el anticipo es inferior al 20%', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={1000}
                paidAmount={0}
                currentConditionId={2}
            />
        );

        const amountInput = screen.getAllByRole('spinbutton')[0];

        fireEvent.change(amountInput, {
            target: { value: '100' },
        });

        expect(
            screen.getByText(/Sugerido 20% mín/i)
        ).toBeInTheDocument();
    });

    it('debe mostrar un error cuando el importe excede el saldo pendiente', () => {
        render(
            <OrderPaymentDialog
                {...defaultProps}
                total={1000}
                paidAmount={600}
            />
        );

        const amountInput = screen.getAllByRole('spinbutton')[0];

        fireEvent.change(amountInput, {
            target: { value: '500' },
        });

        expect(
            screen.getByText(/El monto excede el saldo pendiente/i)
        ).toBeInTheDocument();
    });

    it('debe enviar el archivo seleccionado al confirmar el pago', () => {
        render(<OrderPaymentDialog {...defaultProps} />);

        fireEvent.click(
            screen.getByRole('button', { name: /Seleccionar archivo de prueba/i })
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        );

        expect(mockOnConfirmPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                file: expect.objectContaining({
                    name: 'diseno.pdf',
                }),
            })
        );
    });

    it('debe enviar null cuando se elimina el archivo seleccionado', () => {
        render(<OrderPaymentDialog {...defaultProps} />);

        fireEvent.click(
            screen.getByRole('button', { name: /Seleccionar archivo de prueba/i })
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Eliminar archivo/i })
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar Pago y Guardar/i })
        );

        expect(mockOnConfirmPayment).toHaveBeenCalledWith(
            expect.objectContaining({ file: null })
        );
    });

});