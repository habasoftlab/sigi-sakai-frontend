/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, setLayoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const toggleTheme = () => {
        const nextScheme = layoutConfig.colorScheme === 'light' ? 'dark' : 'light';
        const nextTheme = nextScheme === 'light' ? 'lara-light-blue' : 'lara-dark-purple';
        const themeLink = document.getElementById('theme-css') as HTMLLinkElement;
        const themeHref = `/themes/${nextTheme}/theme.css`;
        if (themeLink) {
            themeLink.href = themeHref;
        }
        setLayoutConfig((prevState) => ({
            ...prevState,
            colorScheme: nextScheme,
            theme: nextTheme
        }));
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo.png`} width="50px" height={'35px'} alt="logo" />
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
                    <i className={`pi pi-${layoutConfig.colorScheme === 'light' ? 'moon' : 'sun'}`}></i>
                    <span>Cambiar Tema</span>
                </button>

                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-bell"></i>
                    <span>Notificaciones</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;