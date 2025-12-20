'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const routePermissions: Record<string, string> = {
    '/': 'VER_DASHBOARD',
    '/counter': 'GESTIONAR_COTIZACIONES',
    '/listquote': 'GESTIONAR_COTIZACIONES',
    '/listorder': 'GESTIONAR_ORDENES',
    '/auth/register': 'GESTIONAR_USUARIOS',
    '/listclient': 'GESTIONAR_CLIENTES',
    '/designerlist': 'VER_PANEL_DISENO',
};

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (pathname.startsWith('/auth/login') || pathname.startsWith('/layout/')) {
            setAuthorized(true);
            return;
        }
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/auth/login');
            return;
        }
        const user = JSON.parse(userStr);
        const userPermisos: string[] = user.permisos || [];
        const requiredPermission = routePermissions[pathname];
        if (requiredPermission) {
            if (!userPermisos.includes(requiredPermission)) {
                if (userPermisos.includes('GESTIONAR_COTIZACIONES')) {
                    router.replace('/counter');
                } else if (userPermisos.includes('GESTIONAR_ORDENES')) {
                    router.replace('/listorder');
                } else {
                    router.replace('/auth/login');
                }
                setAuthorized(false);
            } else {
                setAuthorized(true);
            }
        } else {
            setAuthorized(true);
        }

    }, [pathname, router]);
    if (!authorized && !pathname.startsWith('/auth/login')) {
        return null;
    }

    return <>{children}</>;
};

export default AuthGuard;