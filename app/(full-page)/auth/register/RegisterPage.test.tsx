import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '@/app/(full-page)/auth/register/page';
import { registrarUsuario } from '@/app/service/userService';
import { LayoutContext } from '../../../../layout/context/layoutcontext';

// 1. Mocks de Next.js
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        back: mockBack,
    }),
}));

// 2. Mock del servicio de usuario
jest.mock('@/app/service/userService', () => ({
    registrarUsuario: jest.fn(),
}));

// 3. Mock de PrimeReact Toast para verificar mensajes
const mockToastShow = jest.fn();
jest.mock('primereact/toast', () => ({
    Toast: React.forwardRef((props, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            show: mockToastShow,
        }));
        return <div data-testid="primereact-toast" />;
    }),
}));

// 4. Mock simplificado de PrimeReact Dropdown asociado al id del label
jest.mock('primereact/dropdown', () => ({
    Dropdown: ({ id, value, onChange, options, placeholder }: any) => (
        <select
            id={id} // <-- Asignar el id vincula el <label htmlFor="rol">
            data-testid={`dropdown-${id}`}
            value={value || ''}
            onChange={(e) => onChange({ value: Number(e.target.value) || null })}
        >
            <option value="">{placeholder}</option>
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));

describe('RegisterPage Component', () => {
    const mockLayoutConfig = {
        inputStyle: 'outlined',
    };

    const renderComponent = (customLayoutConfig = mockLayoutConfig) => {
        return render(
            <LayoutContext.Provider value={{ layoutConfig: customLayoutConfig } as any}>
                <RegisterPage />
            </LayoutContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('debe renderizar todos los elementos del formulario correctamente', () => {
        renderComponent();

        expect(screen.getByAltText('Logo')).toBeInTheDocument();
        expect(screen.getByText('Agregar colaborador')).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Roles/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Volver a la pagina anterior/i })).toBeInTheDocument();
    });

    it('debe mostrar advertencia si falta algún campo obligatorio al intentar registrar', async () => {
        renderComponent();

        const submitButton = screen.getByRole('button', { name: /Agregar/i });
        fireEvent.click(submitButton);

        expect(mockToastShow).toHaveBeenCalledWith({
            severity: 'warn',
            summary: 'Atención',
            detail: 'Todos los campos son obligatorios',
        });
        expect(registrarUsuario).not.toHaveBeenCalled();
    });

    it('debe ejecutar el registro exitoso, mostrar toast y redirigir a /auth/login', async () => {
        (registrarUsuario as jest.Mock).mockResolvedValueOnce({});

        renderComponent();

        const nameInput = screen.getByPlaceholderText('Nombre');
        const emailInput = screen.getByPlaceholderText('Correo Electronico');
        const roleDropdown = screen.getByTestId('dropdown-rol');
        const passwordInput = screen.getByPlaceholderText('Contraseña');
        const submitButton = screen.getByRole('button', { name: /Agregar/i });

        fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
        fireEvent.change(emailInput, { target: { value: 'juan@test.com' } });
        fireEvent.change(roleDropdown, { target: { value: '5' } }); // Rol 'Diseñador' (value 5)
        fireEvent.change(passwordInput, { target: { value: 'securePass123' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(registrarUsuario).toHaveBeenCalledWith({
                nombre: 'Juan Pérez',
                email: 'juan@test.com',
                password: 'securePass123',
                rol: 5,
            });
        });

        expect(mockToastShow).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario registrado exitosamente',
        });

        // Avanzar el temporizador de 1000ms para la redirección
        jest.advanceTimersByTime(1000);
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('debe manejar errores si la API de registro falla', async () => {
        // Silenciar console.error solo para esta prueba
        const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => { });

        (registrarUsuario as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Nombre'), { target: { value: 'Pedro' } });
        fireEvent.change(screen.getByPlaceholderText('Correo Electronico'), { target: { value: 'pedro@test.com' } });
        fireEvent.change(screen.getByTestId('dropdown-rol'), { target: { value: '4' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: '123456' } });

        fireEvent.click(screen.getByRole('button', { name: /Agregar/i }));

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al registrar el usuario',
            });
        });

        expect(mockPush).not.toHaveBeenCalled();

        spyConsole.mockRestore();
    });

    it('debe regresar a la página anterior al hacer clic en "Volver a la pagina anterior"', () => {
        renderComponent();

        const backButton = screen.getByRole('button', { name: /Volver a la pagina anterior/i });
        fireEvent.click(backButton);

        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});