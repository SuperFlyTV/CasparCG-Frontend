'use strict';

const p = require('path');
const fs = require('fs');
const childProcess = require('child_process');

const {logMessage} = require('./logger');

// Reads a file using a read stream
// @param {string} location - the location of the file with the file name
// @returns {string} - The files contents
const readFile = (location) => {
    return new Promise((resolve, reject) => {
        const path = p.join(__dirname, '../../', location);
        let raw = '';
        if(fs.existsSync(path)){
            const stream = fs.createReadStream(path);
            stream.on('data', (chunck) => {
                raw += chunck;
            });
            stream.on('end', () => resolve(raw));
            stream.on('error', () => reject('Error reading .env from ' + path));
        } else {
            return reject();
        }
    });
}

// Writes a file to the disk
// @param {string} data - The data to be written
// @param {string} location - The files new lcoation
// @returns {Promise} - Resolves if the write is successful
const writeFile = (data, location) => {
    return new Promise((resolve, reject) => {
        const path = p.join(__dirname, '../../', location);
        const stream = fs.createWriteStream(path);
        stream.on('ready', () => stream.write(data, 'utf8', () => resolve()));
        stream.on('error', () => reject('Error writing file'));
    });
}

// Runs an command using child_process.exec
// @returns {object} - A reference to the command prompted used to run the command
const runexe = (cmd, cwd) => {
    const prompt = childProcess.exec(cmd, {cwd});
    prompt.stdout.on('data', (data) => logMessage(data));
    return prompt;
}

module.exports.readFile = readFile;
module.exports.writeFile = writeFile;
module.exports.runexe = runexe;