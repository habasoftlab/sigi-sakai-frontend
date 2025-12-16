/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { AuthService } from '@/app/service/authService';
import { LoginRequest } from '@/app/types/auth';

const LoginPage = () => {
    // 1. Estados
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    const handleLogin = async () => {
        if (!email || !password) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Ingresa correo y contraseña' });
            return;
        }

        setLoading(true);

        try {
            const credentials: LoginRequest = { email, password };
            const data = await AuthService.login(credentials);
            if (data.token) {
                localStorage.setItem('token', data.token);
                const userInfo = {
                    idUsuario: data.idUsuario,
                    email: email,
                    rol: data.rol,
                    permisos: data.permisos
                };
                localStorage.setItem('user', JSON.stringify(userInfo));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Bienvenido',
                    detail: `Iniciando como ${data.rol}...`
                });
                setTimeout(() => {
                    if (data.permisos.includes('VER_DASHBOARD')) {
                        router.push('/');
                    }
                    else if (data.permisos.includes('GESTIONAR_COTIZACIONES')) {
                        router.push('/counter');
                    }
                    else if (data.permisos.includes('GESTIONAR_ORDENES') || data.permisos.includes('VER_PANEL_TALLER')) {
                        router.push('/listorder');
                    }
                    else {
                        router.push('/pages/access');
                    }
                }, 700);
            } else {
                throw new Error('La respuesta del servidor no contiene un token válido.');
            }
        } catch (error: any) {
            console.error("Error en Login:", error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error de Acceso',
                detail: error.message || 'No se pudo iniciar sesión.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };
    
    return (
        <div className={containerClassName}>
            <Toast ref={toast} />

            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo.png`} alt="Logo" className="mb-5 w-8rem flex-shrink-0" />

                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">Bienvenido!</div>
                            <span className="text-600 font-medium">Inicia sesión para empezar a trabajar</span>
                        </div>

                        <div>
                            {/* CAMPO EMAIL */}
                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Correo Electrónico
                            </label>
                            <InputText
                                id="email"
                                type="text"
                                placeholder="correo@ejemplo.com"
                                className="w-full md:w-30rem mb-5"
                                style={{ padding: '1rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            {/* CAMPO PASSWORD */}
                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Contraseña
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                toggleMask
                                feedback={false}
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                                onKeyDown={handleKeyDown}
                            />
                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center"></div>
                            </div>
                            {/* BOTÓN LOGIN */}
                            <Button
                                label="Iniciar sesión"
                                className="w-full p-3 text-xl"
                                onClick={handleLogin}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;