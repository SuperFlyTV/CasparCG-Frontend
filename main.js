'use strict';

/*
    CasparCG Frontend Electron App
    This file is the core of the application
    All Main Process files are inside the modules folder
    All Renderer process files are in the src folder 
*/

// App Imports
const {app, BrowserWindow, screen} = require('electron');
const ipc = require('electron').ipcMain;
const createApplicationMenu = require('./modules/menu.js');

const endCasparCGServer = require('./modules/casparcg').endCasparCGServer;

// process.env setup
require('dotenv').config();

// IPC Routes
require('./modules/ipc-routes')(ipc);

// Setup development env for electron
if(process.env.ENV === 'DEVELOPMENT') {
    process.env.location = __dirname;
    require('electron-reload')(__dirname, {
        ignored: /tmp|[\/\\]\./
    });
} else {
    process.env.location = process.resourcesPath + '/app';
}

// Global window var
let mainWin;

// Create a new electron window
function createWindow({width, height}) {
    const win = new BrowserWindow({
        backgroundColor: process.env.BACKGROUND_COLOR,
        title: 'CasparCG Configurator',
        width,
        height,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWin = null
    })
    return win;
}


// Main Process Setup and event listeners
app.on('ready', async () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWin = createWindow({width, height});
    createApplicationMenu();
    mainWin.loadFile('./src/html/index.html');
    if(process.env.ENV === 'DEVELOPMENT') mainWin.webContents.openDevTools();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    endCasparCGServer();
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) win = createWindow();
});