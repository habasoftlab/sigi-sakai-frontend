'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card'; // <-- LÍNEA CORREGIDA
import { Timeline } from 'primereact/timeline';


// 1. Definimos una interfaz para nuestros eventos de orden
interface OrderEvent {
    status: string;
    date: string;
    icon: string;
    color: string;
    description: string;
}

/**
 * Página de Timeline para una Orden Específica (basado en Pág. 11)
 */
const OrderTimelinePage = () => {

    const searchParams = useSearchParams();
    const orderId = searchParams.get('id'); // <-- Obtiene el ID (ej. "ORD-001")

    // 2. Reemplazamos los datos de demo con los datos de tu mockup
    const orderEvents: OrderEvent[] = [
        {
            status: 'Orden iniciada',
            date: '15/10/2025 10:30',
            icon: 'pi pi-check', // Icono de tu mockup
            color: '#4CAF50', // Verde
            description: 'El cliente ha confirmado el pago y la orden ha sido creada en el sistema.'
        },
        {
            status: 'Diseño enviado',
            date: '16/10/2025 14:00',
            icon: 'pi pi-send', // Icono de tu mockup
            color: '#2196F3', // Azul
            description: 'El diseñador asignado ha enviado la propuesta de diseño al cliente para su revisión.'
        },
        {
            status: 'Diseño aprobado',
            date: '17/10/2025 09:15',
            icon: 'pi pi-check-circle', // Icono de tu mockup
            color: '#4CAF50', // Verde
            description: 'El cliente revisó y aprobó la propuesta de diseño. La orden está lista para producción.'
        },
        {
            status: 'En impresión',
            date: '17/10/2025 11:00',
            icon: 'pi pi-print', // Icono de tu mockup
            color: '#FF9800', // Naranja
            description: 'La orden ha entrado a la cola de impresión y se está produciendo.'
        },
        {
            status: 'Listo para entrega',
            date: '18/10/2025 16:00',
            icon: 'pi pi-check-square', // Icono de tu mockup
            color: '#607D8B', // Gris
            description: 'El producto impreso está terminado y listo para ser recogido o enviado.'
        }
    ];

    // 3. Contenido de la Card (simplificado)
    //    Removemos la imagen y el botón "Read more" para que coincida con el mockup
    const customizedContent = (item: OrderEvent) => {
        return (
            <Card title={item.status} subTitle={item.date}>
                <p>{item.description}</p>
            </Card>
        );
    };

    // 4. Marcador del Timeline (tu función original estaba bien)
    const customizedMarker = (item: OrderEvent) => {
        return (
            <span
                className="custom-marker shadow-1"
                style={{
                    backgroundColor: item.color,
                    borderRadius: '50%', // <-- 1. Hace el marcador redondo
                    width: '3rem',         // <-- 2. Aumenta el tamaño del marcador
                    height: '3rem',        // <-- 2. Aumenta el tamaño del marcador

                    // --- LÍNEAS AÑADIDAS PARA FORZAR EL CENTRADO ---
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <i className={item.icon} style={{ fontSize: '1.5rem' }}></i> {/* <-- 3. Aumenta el tamaño del ícono */}
            </span>
        );
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center">
                <h2>Orden No. {orderId || '***'}</h2>
                <Link href="/" passHref legacyBehavior>
                    <a className="p-button p-component p-button-text">
                        <i className="pi pi-arrow-left p-button-icon p-button-icon-left"></i>
                        <span className="p-button-label">Regresar</span>
                    </a>
                </Link>
            </div>

            <div className="timeline-demo mt-4">
                <Timeline
                    value={orderEvents}
                    align="alternate"
                    className="customized-timeline"
                    marker={customizedMarker}
                    content={customizedContent}
                />
            </div>
        </div>
    );
};

export default OrderTimelinePage;