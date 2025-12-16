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
            const errorText = await response.text();
            throw new Error(errorText || 'Error en la autenticación');
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