'use strict';

import * as Path from 'path';
import * as Child from 'child_process';
import { fileExists, runExe } from './helpers/file-system';
import * as kill from 'tree-kill';

const tasklist: tl = require('tasklist');

interface tl {
    (): Promise<{
        imageName: string,
        pid: number;
        sessionName: string;
        sessionNumber: number;
        memUsage: number;
    }[]>
}

interface taskItem {
    imageName: string,
    pid: number;
    sessionName: string;
    sessionNumber: number;
    memUsage: number;
}

export interface CasparCG {
    isRunning: boolean;
    launchCasparCGServer(): Promise<Child.ChildProcess>;
    terminateCasparCGServer():  Promise<void>;
}

export class CasparCGServer implements CasparCG {
    private cmdPrompt: Child.ChildProcess | null;
    private child: taskItem;
    private dir: string;
    private commands: string[] = [
        'DIAG',
        'THUMBNAIL GENERATE_ALL'
    ];
    public isRunning: boolean = false;
    public launchTime: Date;

    constructor() {
        if(process.env.CASPARCG_EXE_PATH) {
            this.dir = process.env.CASPARCG_EXE_PATH;
        } else {
            this.findCasparCGServerFile();
        }
    }

    private findCasparCGServerFile(): void {
        let path: string = __dirname;
        const subFolderCount: number = path.split('\\').length;
        for(let i = 0; i < subFolderCount; i++) {
            if(fileExists(Path.join(path, 'caspar.exe'))) {
                this.dir = path;
                break;
            } else {
                path = Path.join(path, '..');
            }
        }
    }
    
    private hasConfigurationFile(): boolean {
        return fileExists(Path.join(this.dir, 'casparcg.config')) ? true : false;
    }

    private getCasparCGServerProcess(): Promise<taskItem> {
        return new Promise((resolve, reject) => {
            tasklist().then(tasks => {
                const isActive = tasks.findIndex(task => 
                    task.imageName.includes('casparcg.exe'));
                return isActive >= 0 ? resolve(tasks[isActive]) : reject();
            });
        });
    }

    public checkCasparServerStatus(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(!this.dir) return reject('Missing caspar.exe file');
            this.getCasparCGServerProcess()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        });
    }
    
    public launchCasparCGServer(dir?: string): Promise<Child.ChildProcess> {
        return new Promise((resolve, reject) => {
            this.checkCasparServerStatus()
            .then(res => {
                if(res === true) throw new Error('CasparCG Server is already running');
            })
            .then(() => this.hasConfigurationFile())
            .then(async() => {
                this.cmdPrompt = runExe('casparcg.exe', {shell: true, cwd: this.dir}, (error, data) => {
                    this.child = null;
                    this.isRunning = false;
                });
                this.child = await this.getCasparCGServerProcess()
                this.launchTime = new Date();
                this.isRunning = true;
                return resolve(this.cmdPrompt);
            }).catch(error => {
                return reject({message: 'Error launching CasparCG Server', raw: error.message});
            });
        });
    }
    
    public terminateCasparCGServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(this.child.pid)
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

    public writeCasparCGCommand(cmd: string): boolean {
        const index = this.commands.findIndex(c => c === cmd);
        if(index >= 0) {
            this.cmdPrompt.stdin.write(cmd + '\n');
            return true;
        } else {
            return false;
        }
    }
}