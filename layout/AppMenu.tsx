/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Inicio',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
                    { label: 'Mostrador', icon: 'pi pi-fw pi-desktop', to: '/counter' },
                    { label: 'Lista de Cotizaciones', icon: 'pi pi-fw pi-file', to: '/listquote' },
                    { label: 'Lista de Ordenes', icon: 'pi pi-fw pi-wallet', to: '/listorder' },
            ]
        },
        {
            label: 'Paginas',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                {
                    label: 'Autenticacion',
                    icon: 'pi pi-fw pi-user',
                    items: [
                        {
                            label: 'Inicio de sesion',
                            icon: 'pi pi-fw pi-sign-in',
                            to: '/auth/login'
                        },
                        {
                            label: 'Registrar nuevo empleado',
                            icon: 'pi pi-fw pi-user-plus',
                            to: '/auth/register'
                        },
                    ]
                },
                {
                    label: 'Estatus orden',
                    icon: 'pi pi-fw pi-calendar',
                    to: '/timeline'
                },
                {
                    label: 'Lista de clientes',
                    icon: 'pi pi-fw pi-book',
                    to: '/listclient'
                },
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;