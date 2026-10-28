import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(full-page)/auth/login/page';
import { AuthService } from '@/app/service/authService';
import { LayoutContext } from '../../../../layout/context/layoutcontext';

// 1. Mocks de Next.js
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// 2. Mock de AuthService
jest.mock('@/app/service/authService', () => ({
    AuthService: {
        login: jest.fn(),
    },
}));

// 3. Mock de PrimeReact Toast para capturar llamadas directas
const mockToastShow = jest.fn();
jest.mock('primereact/toast', () => ({
    Toast: React.forwardRef((props, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            show: mockToastShow,
        }));
        return <div data-testid="primereact-toast" />;
    }),
}));

describe('LoginPage Component', () => {
    const mockLayoutConfig = {
        inputStyle: 'outlined',
    };

    const renderComponent = (customLayoutConfig = mockLayoutConfig) => {
        return render(
            <LayoutContext.Provider value={{ layoutConfig: customLayoutConfig } as any}>
                <LoginPage />
            </LayoutContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('debe renderizar el formulario con todos sus elementos iniciales', () => {
        renderComponent();

        expect(screen.getByAltText('Logo')).toBeInTheDocument();
        expect(screen.getByText('Bienvenido!')).toBeInTheDocument();
        expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });

    it('debe mostrar advertencia si se intenta iniciar sesión con campos vacíos', async () => {
        renderComponent();

        const loginButton = screen.getByRole('button', { name: /Iniciar sesión/i });
        fireEvent.click(loginButton);

        expect(mockToastShow).toHaveBeenCalledWith({
            severity: 'warn',
            summary: 'Atención',
            detail: 'Ingresa correo y contraseña',
        });
        expect(AuthService.login).not.toHaveBeenCalled();
    });

    it('debe manejar correctamente el flujo de login exitoso y guardar datos en localStorage', async () => {
        const mockAuthResponse = {
            token: 'fake-jwt-token',
            idUsuario: 123,
            rol: 'ADMIN',
            permisos: ['VER_DASHBOARD'],
        };

        (AuthService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

        renderComponent();

        const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
        const passwordInput = screen.getByPlaceholderText('Contraseña');
        const loginButton = screen.getByRole('button', { name: /Iniciar sesión/i });

        fireEvent.change(emailInput, { target: { value: 'usuario@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(AuthService.login).toHaveBeenCalledWith({
                email: 'usuario@test.com',
                password: 'password123',
            });
        });

        expect(localStorage.getItem('token')).toBe('fake-jwt-token');
        expect(JSON.parse(localStorage.getItem('user')!)).toEqual({
            idUsuario: 123,
            email: 'usuario@test.com',
            rol: 'ADMIN',
            permisos: ['VER_DASHBOARD'],
        });

        expect(mockToastShow).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Bienvenido',
            detail: 'Iniciando como ADMIN...',
        });

        // Avanzar el timeout de redirección (700ms)
        jest.advanceTimersByTime(700);
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('debe ejecutar el login al presionar Enter en el campo de contraseña', async () => {
        const mockAuthResponse = {
            token: 'fake-token',
            idUsuario: 1,
            rol: 'DISENADOR',
            permisos: ['VER_PANEL_DISENO'],
        };

        (AuthService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

        renderComponent();

        const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
        const passwordInput = screen.getByPlaceholderText('Contraseña');

        fireEvent.change(emailInput, { target: { value: 'diseno@test.com' } });
        fireEvent.change(passwordInput, { target: { value: '123456' } });

        fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(AuthService.login).toHaveBeenCalled();
        });

        jest.advanceTimersByTime(700);
        expect(mockPush).toHaveBeenCalledWith('/designerlist');
    });

    describe('Evaluación de Ruteo Inicial según Permisos', () => {
        const testCases = [
            { permisos: ['VER_DASHBOARD'], expectedPath: '/' },
            { permisos: ['VER_PANEL_DISENO'], expectedPath: '/designerlist' },
            { permisos: ['VER_PANEL_TALLER'], expectedPath: '/workshoplist' },
            { permisos: ['GESTIONAR_COTIZACIONES'], expectedPath: '/counter' },
            { permisos: ['GESTIONAR_ORDENES'], expectedPath: '/listorder' },
            { permisos: ['OTRO_PERMISO_DESCONOCIDO'], expectedPath: '/pages/access' },
            { permisos: [], expectedPath: '/pages/access' },
        ];

        testCases.forEach(({ permisos, expectedPath }) => {
            test(`debe redirigir a ${expectedPath} cuando permisos son ${JSON.stringify(permisos)}`, async () => {
                (AuthService.login as jest.Mock).mockResolvedValueOnce({
                    token: 'tok',
                    idUsuario: 1,
                    rol: 'USER',
                    permisos,
                });

                renderComponent();

                fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@a.com' } });
                fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: '123' } });
                fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

                await waitFor(() => expect(AuthService.login).toHaveBeenCalled());

                jest.advanceTimersByTime(700);
                expect(mockPush).toHaveBeenCalledWith(expectedPath);
            });
        });
    });

    it('debe manejar errores de respuesta del servidor (status 401 o flag error)', async () => {
        const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => { });
        (AuthService.login as jest.Mock).mockResolvedValueOnce({
            status: 401,
            message: 'Credenciales incorrectas',
        });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'err@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'Error de Acceso',
                detail: 'Credenciales incorrectas',
            });
        });

        expect(mockPush).not.toHaveBeenCalled();
        spyConsole.mockRestore();
    });

    it('debe manejar excepciones/fallos de red durante el proceso de login', async () => {
        (AuthService.login as jest.Mock).mockRejectedValueOnce(new Error('Fallo de conexión'));
        const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => { });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'err@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: '123' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

        await waitFor(() => {
            expect(mockToastShow).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'Error de Acceso',
                detail: 'Fallo de conexión',
            });
        });
        spyConsole.mockRestore();
    });
});