'use strict';

/*
    Module that handles all CasparCG server interactions
*/

// Imports to lets us check for and launch the casparcg server
const tasklist = require('tasklist'),
    kill = require('tree-kill');

// NodeJs Modules
const _fs = require('fs');

// Attempts to launch a CasparCG server
// @param {string} path - The path to the casparcg.exe file
// @param {object} ipc - The IPC Main Process to use for main / renderer communcation
// @returns {Promise} - Resolves if Caspar Server is not running and it launches successfully
function launchCasparCGServer(path, ipc) {
    return new Promise((resolve, reject) => {
        tasklist().then(tasks => {
            const active = tasks.filter(function(task) {
                return task.imageName.includes('casparcg.exe');
            });
            if(active.length === 0) {
                if(path.indexOf('casparcg.exe'))
                    path = path.substring(0, path.indexOf('casparcg.exe'));
                const child = require('child_process').execFile('casparcg.exe', {shell: true, cwd: path}, function(error, data) {
                    if(error) {
                        ipc.reply('log-caspar-message', {message: 'CasparCG Server has stopped. ' + error, error: true});
                        return;
                    }
                    ipc.send('log-caspar-message', {message: 'CasparCG Server has stopped', data});
                    //debugger;
                });
                process.env.casparPid = child.pid;
                process.env.casparPath = path;
                process.env.casparExeName = 'casparcg.exe';
                
                child.stdout.on('data', data => {
                    data = data.toString();
                    ipc.reply('log-caspar-message', {message: data});
                });
                return resolve();
            } else {
                return reject(active[0].pid);
            }
        });
    });
}

// Ends the current CasparCG Server instance
// @param {number} pid - The product id for the process needing to be stopped
// @returns {Promise} - A promise that resolves if the process is successfully killed
function endCasparCGServer(pid) {
    return new Promise((resolve, reject) => {
        const preferedPid = process.env.casparPid !== undefined
            ? process.env.casparPid : pid;
        if(preferedPid !== undefined) {
            kill(Number(preferedPid));
            if(process.env.casparPid !== undefined) delete process.env.casparPid;
            return resolve();
        } else {
            return reject('Caspar is not running');
        }
    });
}


// Gets the casaprcg.config file from the specified path
// @param {string} path - The path to search with
// @returns {object} - An object with the prefered path and found config files
function findConfigurationFile(path) {
    return new Promise((resolve, reject) => {
        let preferedPath = process.env.casparPath ? process.env.casparPath : path;
        if(!preferedPath) return reject('No path provided');
        if(preferedPath.includes('.exe')) 
            preferedPath = preferedPath.substring(0, preferedPath.lastIndexOf('\\'));
        _fs.readdir(preferedPath, (error, files) => {
            if(error) return reject(error);
            // Regex to match all files ending in .config
            const configs = files.filter(f => f.match(/(.config)$/));
            return resolve({configs, path: preferedPath});
        });
    });
}

module.exports.launchCasparCGServer = launchCasparCGServer;
module.exports.endCasparCGServer = endCasparCGServer;
module.exports.findConfigurationFile = findConfigurationFile;