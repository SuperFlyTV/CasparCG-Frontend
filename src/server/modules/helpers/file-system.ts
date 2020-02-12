'use strict';

import * as fs from 'fs';
import * as child from 'child_process';

interface ExecFileCallback {
    (error: child.ExecException, data: string): void
}


function isDir(item: string): boolean {
    return fs.lstatSync(item).isDirectory();
}

function isFile(item: string): boolean  {
    return fs.lstatSync(item).isFile();
}

function fileExists(path: string): boolean {
    return fs.existsSync(path); 
}

// Runs an .exe file
// @param {string} file - The file name
// @param {object} options - The options that child_process.ExecFileOptions can use
// @param {object} fn - The callback for the exe run attempt
// @returns {Command Prompt} -  The command prompt window that is created from 
//                              appemting to run the exe file
function runExe(
    file: string, 
    options: child.ExecFileOptions, 
    fn: ExecFileCallback
): child.ChildProcess {
    return child.execFile(file, options, fn);
}

export { fileExists, runExe };