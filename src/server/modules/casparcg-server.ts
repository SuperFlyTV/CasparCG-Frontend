'use strict';

import * as Path from 'path';
import * as Child from 'child_process';
import { fileExists, runExe } from './helpers/file-system';
import * as kill from 'tree-kill';

const tasklist: tl = require('tasklist');

// Interface for the main tasklist function
interface tl {
    (): Promise<{
        imageName: string,
        pid: number;
        sessionName: string;
        sessionNumber: number;
        memUsage: number;
    }[]>
}

// Interface declaring the array of tasks returned from TaskList
interface taskItem {
    imageName: string,
    pid: number;
    sessionName: string;
    sessionNumber: number;
    memUsage: number;
}

// Interface for CasaprCG Node connection
export interface CasparCG {
    isRunning: boolean;
    launchCasparCGServer(): Promise<void>;
    terminateCasparCGServer():  Promise<void>;
    writeCasparCGCommand(cmd: string): void;
    setStdoutFunction(fn: () => void): void;
    setSevrerExitFunction(fn: () => void): void;
}

// Export the CasparCG Server class to allow connection to
// a CasparCG Server
export class CasparCGServer implements CasparCG {
    // The Shell Window CasparCG Server will be executed in
    // Proivides a way to run commands on the server
    private cmdPrompt: Child.ChildProcess | null;
    // The Task Item for the CasparCG Server
    private child: taskItem;
    // Directory the server is running in
    private dir: string;
    public isRunning: boolean = false;
    public launchTime: Date;

    constructor() {
        // Use the CasparCG EXE Path value in the .env file
        if(process.env.CASPARCG_EXE_PATH) {
            this.dir = process.env.CASPARCG_EXE_PATH;
        // Else look in the casparcg.exe file
        } else {
            this.findCasparCGServerFile();
        }
    }

    // Searches for the CasparCG file in all of it's parent directories
    private findCasparCGServerFile(): void {
        // Start in the app directory
        let path: string = __dirname;
        // Get the number of parent folders
        const subFolderCount: number = path.split('\\').length;
        // Loop over each folder and look for the casparcg.exe file
        for(let i = 0; i < subFolderCount; i++) {
            if(fileExists(Path.join(path, 'casparcg.exe'))) {
                // If found, set the class' dir prop to the path
                this.dir = path;
                break;
            } else {
                path = Path.join(path, '..');
            }
        }
    }
    
    // Check for a casparcg.config file
    // @returns {boolean} - If the file is found or not
    private hasConfigurationFile(): boolean {
        return fileExists(Path.join(this.dir, 'casparcg.config')) ? true : false;
    }

    // Check is a process called casparcg.exe is already running
    // @returns {Promise} - Resolves if the process is running
    //                      Rejects if the process is not found
    private getCasparCGServerProcess(): Promise<taskItem> {
        return new Promise((resolve, reject) => {
            tasklist().then(tasks => {
                const isActive = tasks.findIndex(task => 
                    task.imageName.includes('casparcg.exe'));
                return isActive >= 0 ? resolve(tasks[isActive]) : reject();
            });
        });
    }

    // Checks if CasparCG Server is running
    // @returns {Promise} - Resolves true or false if the server is runing or not
    public checkCasparServerStatus(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(!this.dir) return reject('Missing caspar.exe file');
            this.getCasparCGServerProcess()
            .then(() => {
                if(this.isRunning) {
                    return resolve(true);
                } else {
                    return reject('CasparCG Sevrer is already running. Please stop the server and restart it using the Frontend Application.');
                }
            })
            .catch(() => resolve(false));
        });
    }
    
    // Attempts to launch a casparcg server
    // @returns {Promise} - Resolves if the server is started successfully
    //                      Rejects if the serve can not be started
    public launchCasparCGServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.checkCasparServerStatus()
            .then(res => {
                // If the server is running, throw an error
                // Front end App can end instance if it wants
                if(res === true) throw new Error('CasparCG Server is already running');
            })
            .then(() => this.hasConfigurationFile())
            .then(async() => {
                // Attempt to start the casparcg.exe file in the this.dir directory
                this.cmdPrompt = runExe('casparcg.exe', {shell: true, cwd: this.dir}, (error, data) => {
                    this.child = null;
                    this.isRunning = false;
                });
                this.launchTime = new Date();
                this.isRunning = true;
                // Resolve before finding the process so the data and exit
                // can be attached in time
                resolve();
                this.child = await this.getCasparCGServerProcess();
            }).catch(error => {
                return reject({message: 'Error launching CasparCG Server', raw: error});
            });
        });
    }
    
    // Ends the casparCG server instance on this.child
    // @returns {Promise} - Resolves if there was a process and it ends successfully
    //                      Rejects if there is no process or it fails
    public terminateCasparCGServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            if(this.isRunning) {
                try {
                    kill(this.child.pid, error => {
                        if(error) 
                            throw new Error(this.child.pid.toString());
                        return resolve();
                    })
                } catch (error) {
                    return reject({message: 'Error Terminating CasparCG Sevrer', raw: error.message});
                }
            }
        });
    }

    // Finds and writes a simple command to the CasparCG Server
    // @reutns {boolean} - If the command was found and written
    public writeCasparCGCommand(cmd: string): void {
        if(this.isRunning) {
            this.cmdPrompt.stdin.write(cmd + '\n');
            return;
        } else {
            throw new Error('CasparCG Server is not running');
        }
    }

    public setStdoutFunction(fn: (chunk: string) => void): void {
        if(this.cmdPrompt) {
            if(this.cmdPrompt.stdout.listenerCount('data') > 0) {
                this.cmdPrompt.stdout.removeAllListeners('data');
            }
            this.cmdPrompt.stdout.on('data', fn);
        } else {
            throw new Error('CasparCG Server is not running');
        }
    }

    public setSevrerExitFunction(fn: () => void): void {
        if(this.cmdPrompt) {
            this.cmdPrompt.stdout.on('exit', fn);
        } else {
            throw new Error('CasparCG Server is not running');
        }
    }
}