import { downloadDesignFile } from './downloadUtils';

describe('downloadDesignFile Utility', () => {
    let mockToastRef: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockToastRef = {
            current: {
                show: jest.fn()
            }
        };

        // Mock global de URL.createObjectURL y URL.revokeObjectURL
        global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
        global.URL.revokeObjectURL = jest.fn();

        // Interceptamos createElement para proveer un elemento HTML funcional en JSDOM
        const originalCreateElement = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                const anchor = originalCreateElement('a');
                jest.spyOn(anchor, 'click').mockImplementation(() => {});
                return anchor;
            }
            return originalCreateElement(tagName);
        });

        jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
        jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('debe mostrar una advertencia si imageUrl es null o vacío', async () => {
        const result = await downloadDesignFile({
            imageUrl: null,
            toastRef: mockToastRef
        });

        expect(result).toBe(false);
        expect(mockToastRef.current.show).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                summary: 'Archivo no disponible'
            })
        );
    });

    it('debe iniciar la descarga y mostrar notificación de éxito cuando la respuesta es válida', async () => {
        const mockBlob = new Blob(['contenido de prueba'], { type: 'image/png' });

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            blob: jest.fn().mockResolvedValueOnce(mockBlob)
        });

        const result = await downloadDesignFile({
            imageUrl: 'https://ejemplo.com/archivos/diseno.png',
            rutaArchivo: 'ordenes/diseno.png',
            fallbackFilename: 'diseno-fallback.png',
            toastRef: mockToastRef
        });

        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith('https://ejemplo.com/archivos/diseno.png');
        expect(mockToastRef.current.show).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Descarga iniciada'
            })
        );
    });

    it('debe usar fallbackFilename si rutaArchivo no proporciona un nombre válido', async () => {
        const mockBlob = new Blob(['datos'], { type: 'image/png' });

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            blob: jest.fn().mockResolvedValueOnce(mockBlob)
        });

        const result = await downloadDesignFile({
            imageUrl: 'https://ejemplo.com/archivo',
            fallbackFilename: 'referencia-orden-123.png',
            toastRef: mockToastRef
        });

        expect(result).toBe(true);
        expect(mockToastRef.current.show).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' })
        );
    });

    it('debe lanzar error y notificar si el servidor responde con error HTTP (!ok)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        const result = await downloadDesignFile({
            imageUrl: 'https://ejemplo.com/archivo-inexistente.png',
            toastRef: mockToastRef
        });

        expect(result).toBe(false);
        expect(mockToastRef.current.show).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Error de descarga'
            })
        );

        consoleSpy.mockRestore();
    });

    it('debe lanzar error y notificar si el archivo descargado está vacío (blob size 0)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const emptyBlob = new Blob([], { type: 'image/png' });

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            blob: jest.fn().mockResolvedValueOnce(emptyBlob)
        });

        const result = await downloadDesignFile({
            imageUrl: 'https://ejemplo.com/vacio.png',
            toastRef: mockToastRef
        });

        expect(result).toBe(false);
        expect(mockToastRef.current.show).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Error de descarga'
            })
        );

        consoleSpy.mockRestore();
    });
});