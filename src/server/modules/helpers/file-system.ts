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


function runExe(
    file: string, 
    options: child.ExecFileOptions, 
    fn: ExecFileCallback
): child.ChildProcess {
    return child.execFile(file, options, fn);
}

export { fileExists, runExe };