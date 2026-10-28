import { apiClient } from './apiClient';
import { NuevoUsuario } from './userService';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('UserService & registrarUsuario', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

    beforeAll(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080/api';
    });

    afterAll(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('UserService', () => {
        it('debe obtener todos los usuarios correctamente', async () => {
            const { UserService } = require('./userService');
            const mockUsuarios = [
                { idUsuario: 1, nombre: 'Ana López', email: 'ana@empresa.com', idRol: 1 }
            ];

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockUsuarios),
            } as unknown as Response);

            const result = await UserService.getAll();

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/usuarios'));
            expect(result).toEqual(mockUsuarios);
        });

        it('debe obtener la lista de diseñadores', async () => {
            const { UserService } = require('./userService');
            const mockDisenadores = [
                { idUsuario: 3, nombre: 'Diseñador 1', email: 'diseno1@empresa.com', idRol: 3 }
            ];

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockDisenadores),
            } as unknown as Response);

            const result = await UserService.getDesigners();

            expect(mockApiClient).toHaveBeenCalledWith(expect.stringContaining('/usuarios/disenadores'));
            expect(result).toEqual(mockDisenadores);
        });
    });

    describe('registrarUsuario', () => {
        const payload: NuevoUsuario = {
            nombre: 'Juan Pérez',
            email: 'juan@empresa.com',
            password: 'SecurePassword123',
            rol: 2
        };

        it('debe registrar un usuario correctamente mediante un POST', async () => {
            const { registrarUsuario } = require('./userService');
            const mockUsuarioCreado = { idUsuario: 10, ...payload };

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockUsuarioCreado),
            } as unknown as Response);

            const result = await registrarUsuario(payload);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/usuarios'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
            );
            expect(result).toEqual(mockUsuarioCreado);
        });

        it('debe manejar la respuesta de error enviada por el servidor en formato texto', async () => {
            const { registrarUsuario } = require('./userService');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            mockApiClient.mockResolvedValueOnce({
                ok: false,
                text: jest.fn().mockResolvedValueOnce('El correo electrónico ya se encuentra registrado')
            } as unknown as Response);

            await expect(registrarUsuario(payload)).rejects.toThrow(
                'El correo electrónico ya se encuentra registrado'
            );

            consoleSpy.mockRestore();
        });

        it('debe utilizar el mensaje por defecto si la lectura del texto de error falla', async () => {
            const { registrarUsuario } = require('./userService');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            mockApiClient.mockResolvedValueOnce({
                ok: false,
                text: jest.fn().mockRejectedValueOnce(new Error())
            } as unknown as Response);

            await expect(registrarUsuario(payload)).rejects.toThrow('Error al registrar usuario');

            consoleSpy.mockRestore();
        });

        it('debe lanzar error si NEXT_PUBLIC_API_BASE_URL no está configurada', async () => {
            delete process.env.NEXT_PUBLIC_API_BASE_URL;

            jest.isolateModules(async () => {
                const { registrarUsuario: regUser } = require('./userService');
                await expect(regUser(payload)).rejects.toThrow(
                    'La URL de la API no está configurada en las variables de entorno'
                );
            });

            process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080/api';
        });
    });
});