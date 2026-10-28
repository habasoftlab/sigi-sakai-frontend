
import { apiClient } from './apiClient';

describe('apiClient', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('debe agregar Content-Type por defecto si no es FormData', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
        });

        await apiClient('/test-endpoint');

        expect(global.fetch).toHaveBeenCalledWith(
            '/test-endpoint',
            expect.objectContaining({
                headers: expect.any(Headers),
            })
        );

        const calledHeaders = (global.fetch as jest.Mock)
            .mock.calls[0][1].headers as Headers;

        expect(calledHeaders.get('Content-Type')).toBe('application/json');
    });

    it('debe incluir el token de Authorization si existe en localStorage', async () => {
        localStorage.setItem('token', 'fake-jwt-token');

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
        });

        await apiClient('/test-endpoint');

        const calledHeaders = (global.fetch as jest.Mock)
            .mock.calls[0][1].headers as Headers;

        expect(calledHeaders.get('Authorization')).toBe(
            'Bearer fake-jwt-token'
        );
    });

    it('debe extraer el token del objeto user si no existe el token individual', async () => {
        localStorage.setItem(
            'user',
            JSON.stringify({ token: 'nested-jwt-token' })
        );

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
        });

        await apiClient('/test-endpoint');

        const calledHeaders = (global.fetch as jest.Mock)
            .mock.calls[0][1].headers as Headers;

        expect(calledHeaders.get('Authorization')).toBe(
            'Bearer nested-jwt-token'
        );
    });

    it('debe redirigir al login y limpiar localStorage cuando responde 401', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        const mockRedirect = jest.fn();

        localStorage.setItem('token', 'expired-token');
        localStorage.setItem('user', JSON.stringify({ name: 'Test User' }));

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
        });

        await expect(
            apiClient('/test-endpoint', {}, mockRedirect)
        ).rejects.toThrow('Sesión expirada');

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
    });

    it('debe redirigir al login y limpiar localStorage cuando responde 403', async () => {
        const mockRedirect = jest.fn();

        localStorage.setItem('token', 'expired-token');
        localStorage.setItem(
            'user',
            JSON.stringify({ name: 'Test User' })
        );

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 403,
        });

        await expect(
            apiClient('/test-endpoint', {}, mockRedirect)
        ).rejects.toThrow('Sesión expirada');

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
    });

    it('no debe establecer Content-Type manualmente para FormData', async () => {
        const formData = new FormData();
        formData.append('archivo', 'contenido');

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
        });

        await apiClient('/upload', {
            method: 'POST',
            body: formData,
        });

        const calledHeaders = (global.fetch as jest.Mock)
            .mock.calls[0][1].headers as Headers;

        expect(calledHeaders.has('Content-Type')).toBe(false);
    });

    it('debe conservar los encabezados personalizados proporcionados', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
        });

        await apiClient('/test-endpoint', {
            headers: {
                'X-Custom-Header': 'custom-value',
            },
        });

        const calledHeaders = (global.fetch as jest.Mock)
            .mock.calls[0][1].headers as Headers;

        expect(calledHeaders.get('X-Custom-Header')).toBe('custom-value');
        expect(calledHeaders.get('Content-Type')).toBe('application/json');
    });

    it('debe devolver la respuesta cuando la petición es exitosa', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const result = await apiClient('/test-endpoint');

        expect(result).toBe(mockResponse);
    });
});
