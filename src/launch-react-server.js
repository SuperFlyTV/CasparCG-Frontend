'use strict';

const net = require('net');
const childProcess = require('child_process');

const port = 3000;

const client = new net.Socket();

let startedElectron = false;

const tryConnection = () => {
    client.connect({port}, () => {
        client.end();
        if(!startedElectron) {
            console.log('Starting Electron App - React Server has launched');
            startedElectron = true;
            childProcess.exec('npm run-script start-electron');
        }
    });
}

tryConnection();

client.on('error', () => {
    setTimeout(tryConnection, 1000);
});