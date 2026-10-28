
const updateServerUrl = process.env.UPDATE_SERVER_URL;

if (!updateServerUrl) {
    throw new Error('Falta la variable de entorno UPDATE_SERVER_URL');
}

module.exports = {
    appId: 'com.servispeed.app',
    productName: 'SIGI',
    directories: {
        output: 'dist',
    },
    files: [
        'out/**/*',
        'electron/**/*',
    ],
    publish: [
        {
            provider: 'generic',
            url: updateServerUrl,
        },
    ],
    win: {
        target: ['nsis'],
        icon: 'out/favicon.ico',
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
    },
};
