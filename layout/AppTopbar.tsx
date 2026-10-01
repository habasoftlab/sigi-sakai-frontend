/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useNotifications } from '@/app/hooks/useNotifications';
import { NotificationPanel } from '@/app/components/NotificationPanel';

const obtenerUserIdAlmacenado = (): string | null => {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        const userObj = JSON.parse(userStr);
        const id = userObj.idUsuario || userObj.id;
        return id ? String(id) : null;
    } catch (e) {
        console.error('Error parseando sesión de usuario:', e);
        return null;
    }
};

const aplicarTemaEnDOM = (currentScheme: string) => {
    const nextScheme = currentScheme === 'light' ? 'dark' : 'light';
    const nextTheme = nextScheme === 'light' ? 'lara-light-blue' : 'lara-dark-purple';

    const themeLink = document.getElementById('theme-css') as HTMLLinkElement;
    if (themeLink) {
        themeLink.href = `/themes/${nextTheme}/theme.css`;
    }

    return { nextScheme, nextTheme };
};

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, setLayoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);

    const menubuttonRef = useRef<HTMLButtonElement>(null);
    const topbarmenuRef = useRef<HTMLDivElement>(null);
    const topbarmenubuttonRef = useRef<HTMLButtonElement>(null);
    const op = useRef<OverlayPanel>(null);

    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const id = obtenerUserIdAlmacenado();
        if (id) setUserId(id);
    }, []);

    const { notifications, unreadCount, loading, markAsRead } = useNotifications(userId);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const toggleTheme = () => {
        const { nextScheme, nextTheme } = aplicarTemaEnDOM(layoutConfig.colorScheme);

        setLayoutConfig((prevState) => ({
            ...prevState,
            colorScheme: nextScheme,
            theme: nextTheme
        }));
    };

    const textoNotificacionesUnread = unreadCount > 99 ? '99+' : unreadCount;
    const isThemeLight = layoutConfig.colorScheme === 'light';

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src="/layout/images/logo.png" width="50px" height="35px" alt="logo" />
                <span>Servispeed</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button type="button" className="p-link layout-topbar-button" onClick={toggleTheme}>
                    <i className={`pi pi-${isThemeLight ? 'moon' : 'sun'}`}></i>
                    <span>Cambiar Tema</span>
                </button>

                                <button
                    type="button"
                    className="p-link layout-topbar-button relative"
                    onClick={(e) => op.current?.toggle(e)}
                    aria-label="Notificaciones"
                >
                    <i className="pi pi-bell"></i>
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                        <span
                            className="absolute bg-red-500 text-white border-circle flex align-items-center justify-content-center text-xs font-bold shadow-1"
                            style={{ top: '2px', right: '2px', width: '1.25rem', height: '1.25rem', fontSize: '0.7rem' }}
                        >
                            {textoNotificacionesUnread}
                        </span>
                    )}
                </button>

                <OverlayPanel ref={op} className="p-0 shadow-4">
                    <NotificationPanel
                        notifications={notifications}
                        unreadCount={unreadCount}
                        loading={loading}
                        onMarkAsRead={markAsRead}
                        onCloseOverlay={() => op.current?.hide()}
                    />
                </OverlayPanel>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;