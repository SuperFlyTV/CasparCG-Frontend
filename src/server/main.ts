'use strict';

import { app, BrowserWindow, screen, ipcMain as ipc } from "electron";
import * as os from 'os';

import { config } from 'dotenv';
import * as path from 'path';

// CasparCG Server
import { CasparCGServer } from './modules/casparcg-server';

// IPC Routes
import { createIpcRoutes } from './modules/ipc-routes';


config({path: path.join(__dirname, '.env')});

if(process.env.ENV === 'DEVELOPMENT') {
    process.env.location = __dirname;
} else {
    process.env.location = process.resourcesPath + '/app';
}

const CCG = new CasparCGServer();

// Global window var
let windows: Electron.BrowserWindow[] = [];

function createWindow(): Electron.BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const win: Electron.BrowserWindow = new BrowserWindow({
        backgroundColor: process.env.BACKGROUND_COLOR,
        title: 'CasparCG FrontEnd',
        width,
        height,
        webPreferences: {
            nodeIntegration: true
        }
    });
    if(!windows.length) {
        process.env.ENV === 'DEVELOPMENT'
            ? win.loadURL('http://localhost:3000')
            : win.loadFile(path.join(__dirname, '../client/index.html'));
    }
     // Emitted when the window is closed.
    win.on('closed', () => {
        const index: number= windows.findIndex(w => w === win);
        if(index >= 0) windows.splice(index, 1);
        if(!windows.length) {
            if(CCG.isRunning) CCG.terminateCasparCGServer();
            app.quit();
        }
    });
    return win;
}

app.on('ready', () => {
    const mainWindow: Electron.BrowserWindow = createWindow();
    if(process.env.ENV === 'DEVELOPMENT') {
        BrowserWindow.addDevToolsExtension(
            path.join(os.homedir(), process.env.REACT_DEV_EXTENSION)
        );
        mainWindow.webContents.openDevTools();
    }
    windows.push(mainWindow);
    createIpcRoutes(ipc, mainWindow, CCG);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.length === 0) windows.push(createWindow());
});