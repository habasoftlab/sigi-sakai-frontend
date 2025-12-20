export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    idUsuario: number;
    token: string;
    rol: string;
    permisos: string[];
    sub?: string;
    iat?: number;
    exp?: number;
}