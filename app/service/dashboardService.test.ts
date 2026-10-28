import { DashboardService } from './dashboardService';
import { apiClient } from './apiClient';

jest.mock('./apiClient');

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('DashboardService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Peticiones de Gráficas y Métricas (GET)', () => {
        const filtro = 'MES_ACTUAL';

        it('debe obtener los datos de la gráfica de cotizaciones enviando el filtro', async () => {
            const mockData = [{ fecha: '2026-10-01', total: 1200 }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await DashboardService.getCotizacionesGrafica(filtro);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/dashboard/cotizaciones/grafica?filtro=${filtro}`)
            );
            expect(result).toEqual(mockData);
        });

        it('debe lanzar error cuando falla la carga de la gráfica de cotizaciones', async () => {
            mockApiClient.mockResolvedValueOnce({ ok: false } as unknown as Response);

            await expect(DashboardService.getCotizacionesGrafica(filtro)).rejects.toThrow(
                'Error al cargar gráfica de cotizaciones'
            );
        });

        it('debe obtener los datos de la gráfica de órdenes', async () => {
            const mockData = [{ estado: 'Completada', cantidad: 15 }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await DashboardService.getOrdenesGrafica(filtro);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/dashboard/ordenes/grafica?filtro=${filtro}`)
            );
            expect(result).toEqual(mockData);
        });

        it('debe obtener los datos de la gráfica de egresos', async () => {
            const mockData = [{ categoria: 'Insumos', monto: 3500 }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await DashboardService.getEgresosGrafica(filtro);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/dashboard/egresos/grafica?filtro=${filtro}`)
            );
            expect(result).toEqual(mockData);
        });

        it('debe obtener los datos de la gráfica de ingresos', async () => {
            const mockData = [{ mes: 'Octubre', ingreso: 15000 }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockData),
            } as unknown as Response);

            const result = await DashboardService.getIngresosGrafica(filtro);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining(`/dashboard/ingresos/grafica?filtro=${filtro}`)
            );
            expect(result).toEqual(mockData);
        });

        it('debe obtener la tabla de flujo de caja', async () => {
            const mockFlujo = [{ idMovimiento: 1, tipo: 'INGRESO', monto: 500 }];
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockFlujo),
            } as unknown as Response);

            const result = await DashboardService.getFlujoCaja();

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/dashboard/tabla/flujo-caja')
            );
            expect(result).toEqual(mockFlujo);
        });

        it('debe obtener los totales de caja', async () => {
            const mockTotales = { saldoInicial: 1000, totalIngresos: 5000, totalEgresos: 2000, saldoFinal: 4000 };
            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockTotales),
            } as unknown as Response);

            const result = await DashboardService.getTotalesCaja();

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/dashboard/flujo-caja')
            );
            expect(result).toEqual(mockTotales);
        });
    });

    describe('Operaciones de Registro (POST)', () => {
        it('debe registrar un egreso correctamente', async () => {
            const payload = {
                concepto: 'Compra de papel fotográfico',
                monto: 450.50,
                idTipoMovimiento: 2,
                idUsuarioRegistro: 1
            };
            const mockResponse = { idEgreso: 100, ...payload };

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponse),
            } as unknown as Response);

            const result = await DashboardService.registrarEgreso(payload);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/operaciones/egresos'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('debe lanzar el mensaje de error en texto plano cuando falla el registro de egreso', async () => {
            const payload = { concepto: 'Egreso inválido', monto: -10, idTipoMovimiento: 1, idUsuarioRegistro: 1 };
            
            mockApiClient.mockResolvedValueOnce({
                ok: false,
                text: jest.fn().mockResolvedValueOnce('El monto del egreso debe ser positivo')
            } as unknown as Response);

            await expect(DashboardService.registrarEgreso(payload)).rejects.toThrow(
                'El monto del egreso debe ser positivo'
            );
        });

        it('debe lanzar un mensaje genérico cuando falla el registro de egreso sin texto explicativo', async () => {
            const payload = { concepto: 'Error servidor', monto: 10, idTipoMovimiento: 1, idUsuarioRegistro: 1 };

            mockApiClient.mockResolvedValueOnce({
                ok: false,
                text: jest.fn().mockRejectedValueOnce(new Error())
            } as unknown as Response);

            await expect(DashboardService.registrarEgreso(payload)).rejects.toThrow(
                'Error al registrar el movimiento'
            );
        });

        it('debe registrar un ajuste de caja correctamente', async () => {
            const payload = {
                monto: 100,
                concepto: 'Ajuste por descuadre menor',
                tipoAjuste: 'SOBRANTE',
                idUsuario: 1
            };
            const mockResponse = { idAjuste: 5, ...payload };

            mockApiClient.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponse),
            } as unknown as Response);

            const result = await DashboardService.registrarAjusteCaja(payload);

            expect(mockApiClient).toHaveBeenCalledWith(
                expect.stringContaining('/operaciones/ajuste-caja'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('debe lanzar el mensaje de error al fallar el registro de ajuste de caja', async () => {
            const payload = { monto: 0, concepto: '', tipoAjuste: 'FALTANTE', idUsuario: 1 };

            mockApiClient.mockResolvedValueOnce({
                ok: false,
                text: jest.fn().mockResolvedValueOnce('Concepto obligatorio')
            } as unknown as Response);

            await expect(DashboardService.registrarAjusteCaja(payload)).rejects.toThrow(
                'Concepto obligatorio'
            );
        });
    });
});