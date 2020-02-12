'use strict';

const p = require('path');
const packager = require('electron-packager');
const {readFile, writeFile, runexe} = require('./helpers');
const {logMessage} = require('./logger');

// Bundles the React app for prodocution
const bundleReactApp = () => {
    return new Promise((resolve, reject) => {
        logMessage('--- Bundling React App ---', true);
        const prompt = runexe('npm run-script bundle-client', p.join(__dirname, '../../'));
        prompt.on('exit', () => {
            logMessage('--- React App Successfully Bundled ---', true);
            return resolve();
        });
    });
}

// Builds the electron app and places all the files in dist/server
const buildElectronApp = () => {
    return new Promise((resolve, reject) => {
        logMessage('--- Building Electron App ---', true);
        const prompt = runexe('npm run-script build-server', p.join(__dirname, '../../')); 
        prompt.on('exit', () => {
            logMessage('--- Electron App Successfully Built ---', true);
            return resolve();
        });
    });
}


// Runs the Electron Packagers to build an exe file
// @returns {Promise} - Resolves the path to the new env file in the build folder
const packageApp = () => {
    return new Promise(async (resolve, reject) => {
        logMessage('--- Attempting to Package Application ---', true);
        let path;
        const paths = await packager({
            dir: p.join(__dirname, '../../'),
            prune: true,
            overwrite: true,
            out: p.join(__dirname, '../../build')
        }).catch(error => logMessage(error, false));;
        path = paths[0].substring(paths[0].indexOf('build'));
        path = p.join(path, '/resources/app/dist/server/.env');
        logMessage('--- Package Successful ---', true);
        return resolve(path);
    });
}

// Copies the env file from the src/server to build/app/resources/server
const copyEnvFile = async (location) => {
    logMessage('--- Updating ENV to Production ---', true);
    const raw = await readFile('src/server/.env');
    let lines = raw.split('\r\n').filter(item => item.length && item.indexOf('#') !== 0);
    const envIndex = lines.findIndex(item => item.indexOf('ENV') === 0);
    lines[envIndex] = 'ENV=PROD';
    await writeFile(
        lines.join('\r\n'),
        location
    ).then(() => logMessage('--- ENV File Coppied ---', true))
    .catch(error => logMessage(error, false));
}

bundleReactApp()
    .then(buildElectronApp)
    .then(packageApp)
    .then(path => copyEnvFile(path))
    .then(() => {
        logMessage('--- Application Successfully Packaged ---', true);
        logMessage('--- You can run the .exe file from build/casparcg-frontend-application.exe ---', true);
    });