'use strict';

/*
    The application main IPC routes
    These provide front to back end communication 
    similiar to Fetch in a browser 
*/

// Just for type checking
import { IpcMainEvent } from 'electron';
import { CasparCGServer } from './casparcg-server';

// Export the IPC routes for main communication with Caspar
// @param {object} ipc - The ipc object to atach the routes to
// @param {object} win - The window to send updates to when required
// @param {object} CCG - The CasparCG instance to use when updating Caspar
export const createIpcRoutes = (
    ipc: Electron.IpcMain, 
    win: Electron.BrowserWindow, 
    CCG: CasparCGServer
) => {
    ipc.on('request-caspar-connection', (
        event: IpcMainEvent, 
        req: {shouldConnect: boolean}
    ) => {
        if(req.shouldConnect) {
            CCG.launchCasparCGServer().then(() => {
                // Set the IPC route for Server logs
                CCG.setStdoutFunction((chunk) => 
                    win.webContents.send('casparcg-server-log', {message: chunk}));
                // Set the IPC route for if the server ends
                CCG.setSevrerExitFunction(() => 
                    win.webContents.send('caspar-connection', {status: false}));
                // Tell all connected windows, the server has started
                win.webContents.send('caspar-connection', {status: true, launchTime: CCG.launchTime});
            }).catch(error => {
                event.reply('reply-caspar-connection', {status: null, error: error.raw});
            });
        } else {
            // Stop the server
            CCG.terminateCasparCGServer().then(() => {
                win.webContents.send('caspar-connection', {status: false});
            }).catch(error => event.reply(
                'reply-caspar-connection', 
                {status: null, error: error.raw}
            ));
        }
    });

    ipc.on('request-caspar-info', (event: IpcMainEvent, req: void) => {
        // Check the servers output for the responce to the version command
        CCG.setStdoutFunction((chunk) => {
            if(chunk.includes('#201 VERSION')) {
                const index: number = chunk.indexOf('VERSION OK') + 'VERSION OK'.length;
                const version: string = chunk.substring(index, index + 8);
                // Reset the server's output function
                CCG.setStdoutFunction((chunk) => 
                    win.webContents.send('casparcg-server-log', {message: chunk}))
                event.reply('reply-caspar-info', {version});
            } else {
                win.webContents.send('casparcg-server-log', {message: chunk});
            }
        });
        CCG.writeCasparCGCommand('version');
    });

    ipc.on('request-caspar-status', (event: IpcMainEvent, req: null) => {
        CCG.checkCasparServerStatus().then(res => {
            event.reply('reply-caspar-status', {status: res, launchTime: CCG.launchTime});
        }).catch(error => {
            event.reply('reply-caspar-status', {status: false, error});
        });
    });

    ipc.on('request-caspar-command', (
        event: IpcMainEvent, 
        res: {command: string}
    ) => {
        CCG.writeCasparCGCommand(res.command);
        event.reply('reply-caspar-command', {result: true});
    });
}