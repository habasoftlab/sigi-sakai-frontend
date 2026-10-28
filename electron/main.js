const { app, BrowserWindow, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');

const isDev = !app.isPackaged;
let server;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function startStaticServer() {
    return new Promise((resolve) => {
        server = http.createServer((request, response) => {
            return handler(request, response, {
                public: path.join(__dirname, '../out')
            });
        });

        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            resolve(port);
        });
    });
}

async function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, '../out/favicon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            devTools: isDev
        }
    });

    if (!isDev) {
        Menu.setApplicationMenu(null);
    }

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        const port = await startStaticServer();
        mainWindow.loadURL(`http://127.0.0.1:${port}`);
    }

    if (!isDev) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (
                input.key === 'F12' ||
                (input.control && input.shift && input.key.toLowerCase() === 'i') ||
                (input.meta && input.alt && input.key.toLowerCase() === 'i')
            ) {
                event.preventDefault();
            }
        });
    }
}

app.whenReady().then(async () => {
    await createWindow();

    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

autoUpdater.on('update-available', () => {
    console.log('Nueva actualización disponible.');
});

autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Actualización lista',
        message: `La versión ${info.version} ha sido descargada. Se instalará al reiniciar la aplicación.`,
        buttons: ['Reiniciar ahora', 'Más tarde']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (err) => {
    console.error('Error en auto-updater:', err);
});

app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
});