import { AuthService } from './authService';

describe('AuthService', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('login', () => {
        const credentials = { email: 'testuser', password: 'password123' };

        it('debe iniciar sesión exitosamente y retornar AuthResponse', async () => {
            const mockAuthResponse = {
                token: 'fake-jwt-token',
                user: { id: 1, name: 'Test User' }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockAuthResponse)
            });

            const result = await AuthService.login(credentials);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/login'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                })
            );
            expect(result).toEqual(mockAuthResponse);
        });

        it('debe lanzar el mensaje de error personalizado cuando el servidor responde con errorData.message', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockResolvedValueOnce({ message: 'Credenciales inválidas' })
            });

            await expect(AuthService.login(credentials)).rejects.toThrow('Credenciales inválidas');
        });

        it('debe lanzar errorData.error si no existe errorData.message', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockResolvedValueOnce({ error: 'Usuario bloqueado' })
            });

            await expect(AuthService.login(credentials)).rejects.toThrow('Usuario bloqueado');
        });

        it('debe manejar respuestas de error que no son JSON y retornar el texto o un error por defecto', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockRejectedValueOnce(new Error('Unexpected token')),
                text: jest.fn().mockResolvedValueOnce('Internal Server Error')
            });

            await expect(AuthService.login(credentials)).rejects.toThrow('Internal Server Error');
        });
    });

    describe('logout', () => {
        it('debe eliminar el token y el usuario de localStorage', () => {
            localStorage.setItem('token', 'fake-token');
            localStorage.setItem('user', JSON.stringify({ id: 1 }));

            AuthService.logout();

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('debe retornar true si existe un token válido en localStorage', () => {
            localStorage.setItem('token', 'valid-token');

            expect(AuthService.isAuthenticated()).toBe(true);
        });

        it('debe retornar false si no existe token', () => {
            expect(AuthService.isAuthenticated()).toBe(false);
        });

        it('debe retornar false si el token es la cadena "undefined"', () => {
            localStorage.setItem('token', 'undefined');

            expect(AuthService.isAuthenticated()).toBe(false);
        });
    });
});