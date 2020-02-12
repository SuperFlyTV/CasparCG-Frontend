'use strict';

// Node Module Imports
const net = require('net');
const p = require('path');

// Helper Modules
const {readFile, writeFile, runexe} = require('./helpers');
const {logMessage} = require('./logger');

// React Dev Server Port
const port = 3000;

// Builds the electron app and places all the files in dist/server
const buildElectronApp = () => {
    return new Promise((resolve, reject) => {
        logMessage('--- Building Electron App ---', true);
        const prompt = runexe('npm run-script build-server', p.join(__dirname, '../../')); 
        prompt.on('exit', () => resolve());
    });
}

// Launches the React Dev Server with Webpack
const launchReactServer = () => {
    return new Promise((resolve, reject) => {
        logMessage('--- Launching React Dev Server w/ Webpack ---', true);
        runexe('npm run-script start-react', p.join(__dirname, '../../'));
        return resolve();
    });
}

// Waits for the React Dev Server to launch
const connectReactServer = () => {
   return new Promise((resolve, reject) => {
        const client = new net.Socket();
        logMessage('--- Waiting for React Dev Server ---', true);
        client.connect({port}, () => {
            logMessage('--- React Server has launched ---', true);
            client.end();
            return resolve();
        });
        client.on('error', () => {
            connectReactServer().then(resolve);
        });
   });
}

// Waitches for changes in the src/server directory
const watchElectronApp = () => {
    logMessage('--- Building Electron App ---', true);
    runexe('npm run-script build-server:watch', p.join(__dirname, '../../'));
}

// Launches the electron app
const launchElectronApp = () => {
    logMessage('--- Starting Electron App ---', true);
    runexe('npm run-script start-electron', p.join(__dirname, '../../'));
}

// Copies the .env file from the src directory to the dist directory
const copyENVFile = async () => {
    const raw = await readFile('src/server/.env');
    let lines = raw.split('\r\n').filter(item => item.length && item.indexOf('#') !== 0);
    await writeFile(
        lines.join('\r\n'),
        'dist/server/.env'
    ).catch(error => logMessage(error, false));
    logMessage('--- ENV File Coppied ---', true);
}


buildElectronApp()
.then(launchReactServer)
.then(connectReactServer)
.then(() => watchElectronApp())
.then(() => copyENVFile())
.then(() => launchElectronApp())