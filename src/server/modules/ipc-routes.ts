'use strict';

import { IpcMainEvent } from 'electron';

import { CasparCGServer } from './casparcg-server';

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
            CCG.launchCasparCGServer().then(child => {
                child.stdout.on('data', (chunk) => 
                    win.webContents.send('casparcg-server-log', {message: chunk}));
                child.on('exit', () => {
                    win.webContents.send('caspar-connection', {status: false});
                });
                win.webContents.send('caspar-connection', {status: true, launchTime: CCG.launchTime});
            }).catch(error => {
                event.reply('reply-caspar-connection', {status: null, error: error.message});
            });
        } else {
            CCG.terminateCasparCGServer().then(() => {
                win.webContents.send('caspar-connection', {status: false});
            }).catch(error => event.reply(
                'reply-caspar-connection', 
                {status: null, error: error.message}
            ));
        }
    });

    ipc.on('request-caspar-status', (event: IpcMainEvent, req: null) => {
        CCG.checkCasparServerStatus().then(res => {
            event.reply('reply-caspar-status', {status: res, launchTime: CCG.launchTime});
        }).catch(error => {
            event.reply('reply-caspar-status', {status: false, error: true});
        });
    });

    ipc.on('request-caspar-command', (
        event: IpcMainEvent, 
        res: {command: string}
    ) => {
        const result: boolean = CCG.writeCasparCGCommand(res.command);
        event.reply('reply-caspar-command', {result});
    });
}