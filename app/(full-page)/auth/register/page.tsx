/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { registrarUsuario, NuevoUsuario } from '@/app/service/userService';

interface RolOption {
    label: string;
    value: number;
}

const RegisterPage = () => {
    const [password, setPassword] = useState<string>('');
    const [nombre, setNombre] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const { layoutConfig } = useContext(LayoutContext);
    const [selectedRol, setSelectedRol] = useState<number | null>(null);
    const toast = useRef<Toast>(null);

    const roles: RolOption[] = [
        { label: 'Diseñador', value: 5 },
        { label: 'Mostrador', value: 4 },
        { label: 'Jefe de taller', value: 6 }
    ];

    const router = useRouter();

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    const handleRegistrar = async () => {
        if (!nombre || !email || !password || !selectedRol) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Todos los campos son obligatorios' });
            return;
        }

        const nuevoUsuario: NuevoUsuario = {
            nombre,
            email,
            password,
            rol: selectedRol
        };

        try {
            await registrarUsuario(nuevoUsuario);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario registrado exitosamente' });
            setTimeout(() => {
                router.push('/auth/login');
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al registrar el usuario' });
        }
    };

    const handleReturn = () => {
        router.back();
    };

    return (
        <div className={containerClassName}>
            <Toast ref={toast} />

            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo.png`} alt="Logo" className="w-12rem flex-shrink-0" />

                <div style={{
                    borderRadius: '56px',
                    padding: '0.3rem',
                    background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-2">Bienvenido!</div>
                            <span className="text-600 font-medium">Agregar colaborador</span>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-900 text-xl font-medium mb-2">Nombre</label>
                            <InputText
                                id="name"
                                type="text"
                                placeholder="Nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full md:w-30rem mb-2"
                                style={{ padding: '1rem' }}
                            />

                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">Correo Electrónico</label>
                            <InputText
                                id="email"
                                type="text"
                                placeholder="Correo Electronico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full md:w-30rem mb-2"
                                style={{ padding: '1rem' }}
                            />

                            <label htmlFor="rol" className="block text-900 text-xl font-medium mb-2">Roles</label>
                            <Dropdown
                                id="rol"
                                value={selectedRol}
                                onChange={(e) => setSelectedRol(e.value)}
                                options={roles}
                                optionLabel="label"
                                placeholder="Selecciona su rol"
                                className="w-full md:w-30rem mb-2"
                                style={{ padding: '0.2rem' }}
                            />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Contraseña
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                toggleMask
                                className="w-full mb-2"
                                inputClassName="w-full p-3 md:w-30rem"
                            />

                            <div className="flex align-items-center justify-content-between mb-4 gap-4">
                            </div>

                            <Button
                                label="Agregar"
                                className="w-full p-3 mb-2 text-xl"
                                onClick={handleRegistrar}
                            ></Button>
                            <Button
                                label="Volver a la pagina anterior"
                                icon="pi pi-arrow-left"
                                className="w-full p-1 text-g p-button-secondary"
                                onClick={handleReturn}
                            ></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;