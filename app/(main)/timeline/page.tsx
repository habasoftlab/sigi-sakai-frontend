'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { OrderService } from '@/app/service/orderService';

interface HistorialItem {
    fecha: string;
    estatus: string;
    usuario: string;
    claveEstatus: string;
}

interface TimelineEvent extends HistorialItem {
    icon: string;
    color: string;
}

const OrderTimelinePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');

    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [backPath, setBackPath] = useState('/');

    const toast = useRef<Toast>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const rolUsuario = (user.rol || '').toLowerCase();
            const rolesDirectivos = ['admin', 'contadora', 'contador', 'dueño', 'dueno'];
            if (rolesDirectivos.some(r => rolUsuario.includes(r))) {
                setBackPath('/');
            }
            else {
                setBackPath('/listorder');
            }
        }
    }, []);

    useEffect(() => {
        if (!orderId) return;
        const fetchHistory = async () => {
            try {
                const data = await OrderService.getHistorial(Number(orderId));
                const formattedEvents = data.map((item: HistorialItem) => ({
                    ...item,
                    ...getStyleByStatus(item.claveEstatus)
                }));
                setEvents(formattedEvents);
            } catch (error) {
                console.error(error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' });
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [orderId]);

    const getStyleByStatus = (clave: string) => {
        switch (clave) {
            case 'COT_INICIADA':
                return { icon: 'pi pi-file', color: '#FFC107' };
            case 'COT_PAGADA':
                return { icon: 'pi pi-dollar', color: '#2196F3' };
            case 'ORD_EN_DISENO_CON_INSUMOS':
            case 'ORD_EN_DISENO_SIN_INSUMOS':
                return { icon: 'pi pi-palette', color: '#720a85ff' };
            case 'DIS_EN_PROCESO':
                return { icon: 'pi pi-file-edit', color: '#9C27B0' };
            case 'DIS_EN_REVISION_CLIENTE':
                return { icon: 'pi pi-eye', color: '#673AB7' };
            case 'DIS_DISENO_APROBADO':
                return { icon: 'pi pi-thumbs-up', color: '#4CAF50' };
            case 'DIS_DISENO_RECHAZADO':
                return { icon: 'pi pi-thumbs-down', color: '#F44336' };
            case 'ORD_EN_IMPRESION':
                return { icon: 'pi pi-print', color: '#FF9800' };
            case 'ORD_LISTA_ENTREGA':
                return { icon: 'pi pi-verified', color: '#009688' };
            case 'ORD_ENTREGADA':
                return { icon: 'pi pi-check-circle', color: '#607D8B' };
            case 'CANCELADA':
                return { icon: 'pi pi-times-circle', color: '#D32F2F' };
            default:
                return { icon: 'pi pi-cog', color: '#9E9E9E' };
        }
    };

    const customizedContent = (item: TimelineEvent) => {
        return (
            <Card
                title={item.estatus}
                subTitle={item.fecha}
                className="shadow-2"
                pt={{
                    title: { className: 'text-base md:text-lg font-bold mb-1' },
                    subTitle: { className: 'text-sm text-gray-500 mb-0' },
                    content: { className: 'p-0' },
                    body: { className: 'p-3' }
                }}
            >
                {item.usuario && (
                    <div className="flex align-items-center gap-2 mt-2 text-sm text-700 bg-100 p-2 border-round">
                        <i className="pi pi-user text-primary"></i>
                        <span>Atendió: <span className="font-semibold">{item.usuario}</span></span>
                    </div>
                )}
            </Card>
        );
    };

    const customizedMarker = (item: TimelineEvent) => {
        return (
            <span
                className="flex align-items-center justify-content-center shadow-2"
                style={{
                    backgroundColor: item.color,
                    borderRadius: '50%',
                    width: '3rem',
                    height: '3rem',
                    color: '#ffffff'
                }}
            >
                <i className={item.icon} style={{ fontSize: '1.2rem' }}></i>
            </span>
        );
    };

    return (
        <div className="card">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="m-0 text-900">Seguimiento de Orden</h2>
                    <span className="text-gray-500">Historial de movimientos para la orden #{orderId || '...'}</span>
                </div>
                <Button
                    label="Regresar"
                    icon="pi pi-arrow-left"
                    text
                    onClick={() => router.push(backPath)}
                />
            </div>

            {loading ? (
                <div className="flex justify-content-center py-6">
                    <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                </div>
            ) : events.length > 0 ? (
                <Timeline
                    value={events}
                    align="alternate"
                    className="customized-timeline"
                    marker={customizedMarker}
                    content={customizedContent}
                />
            ) : (
                <div className="text-center p-5 border-1 border-dashed border-300 border-round">
                    <i className="pi pi-info-circle text-4xl text-gray-400 mb-3"></i>
                    <p className="text-gray-600 m-0">No hay historial registrado para esta orden.</p>
                </div>
            )}
        </div>
    );
};

export default OrderTimelinePage;