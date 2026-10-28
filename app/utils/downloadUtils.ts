import { MutableRefObject } from 'react';
import { Toast } from 'primereact/toast';

interface DownloadDesignOptions {
    imageUrl: string | null;
    rutaArchivo?: string;
    fallbackFilename?: string;
    toastRef?: MutableRefObject<Toast | null>;
}

export const downloadDesignFile = async ({
    imageUrl,
    rutaArchivo,
    fallbackFilename = 'archivo-diseno',
    toastRef
}: DownloadDesignOptions): Promise<boolean> => {
    if (!imageUrl) {
        toastRef?.current?.show({
            severity: 'warn',
            summary: 'Archivo no disponible',
            detail: 'No hay una referencia disponible para descargar.'
        });
        return false;
    }

    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('El archivo descargado está vacío.');
        }

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const filename = decodeURIComponent(
            rutaArchivo?.split('/').pop()?.split('?')[0] || fallbackFilename
        );

        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        toastRef?.current?.show({
            severity: 'success',
            summary: 'Descarga iniciada',
            detail: 'El diseño está listo para guardarse.'
        });

        return true;
    } catch (error) {
        console.error('Error descargando diseño:', error);

        toastRef?.current?.show({
            severity: 'error',
            summary: 'Error de descarga',
            detail: 'No se pudo descargar la referencia. Verifica la conexión con el servidor.'
        });

        return false;
    }
};