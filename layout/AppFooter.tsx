/* eslint-disable @next/next/no-img-element */

import React, { } from 'react';

const AppFooter = () => {
    return (
        <div className="layout-footer">
            <img src={`/layout/images/logo.png`} alt="Logo" height="40" className="mr-2" />
            <span className="font-medium ml-2">Servispeed</span>
        </div>
    );
};

export default AppFooter;
