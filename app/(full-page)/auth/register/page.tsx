/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';

const RegisterPage = () => {
    const [password, setPassword] = useState('');
    const { layoutConfig } = useContext(LayoutContext);
    const [selectedRol, setSelectedRol] = useState(null);
    const roles = [
        { label: 'Diseñador', value: 'diseñador' },
        { label: 'Mostrador', value: 'mostrador' },
        { label: 'Jefe de taller', value: 'jefe_taller' }
    ];
    const router = useRouter();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo.png`} alt="Logo" className="w-12rem flex-shrink-0" />
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
                            <span className="text-600 font-medium">Agregar colaborador </span>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-900 text-xl font-medium mb-2">
                                Nombre
                            </label>
                            <InputText id="name" type="text" placeholder="Nombre" className="w-full md:w-30rem mb-4" style={{ padding: '1rem' }} />

                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Correo Electronico
                            </label>
                            <InputText id="email" type="text" placeholder="Correo Electronico" className="w-full md:w-30rem mb-4" style={{ padding: '1rem' }} />

                            <label htmlFor="rol" className="block text-900 text-xl font-medium mb-2">
                                Roles
                            </label>
                            <Dropdown
                                id="rol"
                                value={selectedRol}
                                onChange={(e) => setSelectedRol(e.value)}
                                options={roles}
                                optionLabel="label"
                                placeholder="Selecciona su rol"
                                className="w-full md:w-30rem mb-4"
                                style={{ padding: '0.2rem' }}
                            />
                            
                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Contraseña
                            </label>
                            <Password inputId="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" toggleMask className="w-full mb-4" inputClassName="w-full p-3 md:w-30rem"></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                </div>
                            </div>

                            <Button label="Agregar" className="w-full p-3 text-xl" onClick={() => router.push('/auth/login')}></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
