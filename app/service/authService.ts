import { LoginRequest, AuthResponse } from '../types/auth';

const AUTH_API_URL = process.env.NEXT_PUBLIC_LOGIN_API_URL;

export const AuthService = {

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) {
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    throw new Error(errorData.message);
                }
                throw new Error(errorData.error || 'Error en la autenticación');
            } catch (jsonError: any) {
                if (jsonError.message && jsonError.message !== 'Unexpected token') {
                    throw jsonError;
                }
                const errorText = await response.text().catch(() => '');
                throw new Error(errorText || 'Ocurrió un error desconocido');
            }
        }

        return await response.json();
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }
};