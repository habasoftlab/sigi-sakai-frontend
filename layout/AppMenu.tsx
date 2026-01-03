/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { useRouter } from 'next/navigation';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const [filteredModel, setFilteredModel] = useState<AppMenuItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userPermisos: string[] = user?.permisos || [];

        const userRole = user?.rol || user?.role || '';

        const managementRoles = ['ADMIN', 'ADMINISTRADOR', 'DUEÑO', 'CONTADORA', 'CONTADOR'];
        const isManagement = managementRoles.includes(userRole.toUpperCase());

        const fullModel: any[] = [
            {
                label: 'Inicio',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        to: '/',
                        permiso: 'VER_DASHBOARD'
                    },
                    {
                        label: 'Mostrador',
                        icon: 'pi pi-fw pi-desktop',
                        to: '/counter',
                        permiso: 'GESTIONAR_COTIZACIONES'
                    },
                    {
                        label: 'Lista de clientes',
                        icon: 'pi pi-fw pi-users',
                        to: '/listclient',
                        permiso: 'GESTIONAR_CLIENTES'
                    },
                    {
                        label: 'Lista de Cotizaciones',
                        icon: 'pi pi-fw pi-list',
                        to: '/listquote',
                        permiso: 'GESTIONAR_COTIZACIONES'
                    },
                    {
                        label: 'Lista de Ordenes',
                        icon: 'pi pi-fw pi-inbox',
                        to: '/listorder',
                        permiso: 'GESTIONAR_ORDENES'
                    },
                    {
                        label: 'Administración',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Registrar nuevo empleado',
                                icon: 'pi pi-fw pi-user-plus',
                                to: '/auth/register',
                                permiso: 'GESTIONAR_USUARIOS'
                            },
                        ]
                    },
                ]
            }
        ];

        if (!isManagement) {
            fullModel.push({
                label: 'Areas de Trabajo',
                items: [
                    {
                        label: 'Lista de Ordenes - Disenador',
                        icon: 'pi pi-fw pi-palette',
                        to: '/designerlist',
                        permiso: 'VER_PANEL_DISENO'
                    },
                    {
                        label: 'Lista de Ordenes - Jefe de Taller',
                        icon: 'pi pi-fw pi-cog',
                        to: '/workshoplist',
                        permiso: 'VER_PANEL_TALLER'
                    },
                ]
            });
        }

        const filterMenuByPermissions = (items: any[]): any[] => {
            return items.reduce((acc, item) => {
                const hasPermission = !item.permiso || userPermisos.includes(item.permiso);
                if (hasPermission) {
                    if (item.items) {
                        const filteredItems = filterMenuByPermissions(item.items);
                        if (filteredItems.length > 0 || item.items.length === 0) {
                            acc.push({ ...item, items: filteredItems });
                        }
                    } else {
                        acc.push(item);
                    }
                }
                return acc;
            }, []);
        };

        const menuFiltered = filterMenuByPermissions(fullModel);
        setFilteredModel(menuFiltered);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
    };

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {filteredModel.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
                <li className="menu-separator"></li>
                <li className="layout-root-menuitem">
                    <div className="layout-menuitem-root-text">Cuenta</div>
                    <ul>
                        <li>
                            <a
                                onClick={handleLogout}
                                className="p-ripple cursor-pointer"
                                style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem' }}
                            >
                                <i className="pi pi-fw pi-power-off layout-menuitem-icon mr-2"></i>
                                <span className="layout-menuitem-text">Cerrar Sesión</span>
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;