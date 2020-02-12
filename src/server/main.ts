'use strict';

import { app, BrowserWindow, screen, ipcMain as ipc } from "electron";
import * as os from 'os';

import { config } from 'dotenv';
import * as path from 'path';

// CasparCG Server
import { CasparCGServer } from './modules/casparcg-server';

// IPC Routes
import { createIpcRoutes } from './modules/ipc-routes';

// Load .env file
config({path: path.join(__dirname, '.env')});

if(process.env.ENV === 'DEVELOPMENT') {
    // Set apps location to this files directory
    process.env.location = __dirname;
    if(!process.env.REACT_URL) 
        process.env.REACT_URL = 'http://localhost:3000';
} else {
    // Set the location to electron's resource path -> app folder
    process.env.location = process.resourcesPath + '/app';
}

// Create a new CCG controller
const CCG = new CasparCGServer();

// Global window var
let windows: Electron.BrowserWindow[] = [];

// Electron create window function
// @returns {object} - Electron browser window to display the page in.
function createWindow(): Electron.BrowserWindow {
    // Default window width and height
    const width: number = 1260,
        height: number = 720;
    const win: Electron.BrowserWindow = new BrowserWindow({
        backgroundColor: process.env.BACKGROUND_COLOR,
        title: 'CasparCG FrontEnd',
        width,
        height,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // If in development, load the React Server
    // Else, load the bundled file
    if(!windows.length) {
        process.env.ENV === 'DEVELOPMENT'
            ? win.loadURL(process.env.REACT_URL)
            : win.loadFile(path.join(__dirname, '../client/index.html'));
    }
     // Emitted when the window is closed.
    win.on('closed', () => {
        // Find the window
        const index: number= windows.findIndex(w => w === win);
        if(index >= 0) windows.splice(index, 1);
        if(!windows.length) {
            // If the app is shutting down, end the CasparCG server as well
            if(CCG.isRunning) CCG.terminateCasparCGServer();
            app.quit();
        }
    });
    return win;
}

app.on('ready', () => {
    // Create a new main window
    const mainWindow: Electron.BrowserWindow = createWindow();
    // If in development mode and there is a React Dev Extension provided
    // Load the extension
    if(process.env.ENV === 'DEVELOPMENT' 
    && process.env.REACT_DEV_EXTENSION) {
        BrowserWindow.addDevToolsExtension(
            path.join(os.homedir(), process.env.REACT_DEV_EXTENSION)
        );
        mainWindow.webContents.openDevTools();
    }
    // Add the main window to the window list
    windows.push(mainWindow);
    // Add the IPC routes to the main window 
    // for Front to back end communcation
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