import React, { useState, createContext, useMemo } from 'react';
import { ChildContainerProps, MenuContextProps } from '@/types';

export const MenuContext = createContext({} as MenuContextProps);

export const MenuProvider = ({ children }: ChildContainerProps) => {
    const [activeMenu, setActiveMenu] = useState('');

    const value = useMemo(() => ({
        activeMenu,
        setActiveMenu
    }), [activeMenu, setActiveMenu]);

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
};
