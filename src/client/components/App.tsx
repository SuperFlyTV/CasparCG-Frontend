import * as React from "react";

import {ipcRenderer as IPC} from "electron";
// HashRouter because Electron is not a typical broswer window 
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

// Component Imports
import Header from './ui/Header';
import Nav from './ui/Nav';
import ServerPage from './ui/ServerPage';
import ConsolePage from './ui/ConsolePage';

interface Log {
    message: string, 
    error: boolean,
    date: Date
}

interface AppState {
    status: boolean;
    launchTime: Date | null;
    logs: Log[];
    startupLogs: Log[];
    startup: boolean;
    message: string;
    version: string;
    redirect?: string;
}

// Defualt client side component for the CasparCG Frontend
export default class App extends React.Component<{}, AppState> {
    constructor(props: object) {
        super(props);
        this.clearTimeout = this.clearTimeout.bind(this);
        this.handleApplicationMessage = this.handleApplicationMessage.bind(this);
        this.updateCasparStatus = this.updateCasparStatus.bind(this);
        this.handleServerLog = this.handleServerLog.bind(this);
        this.clearLogs = this.clearLogs.bind(this);
    }

    state: AppState = {
        status: false,
        logs: [] as Log[],
        startupLogs: [] as Log[],
        startup: true,
        message: null,
        launchTime: null,
        version: null
    }

    // Timeout for hiding messages
    private timeOut: NodeJS.Timeout;

    // Clears the timeout and set's it's value to null
    private clearTimeout() {
        clearTimeout(this.timeOut);
        this.timeOut = null;
    }

    // Handles a new message to display to the user
    // @param {string?} message - Optional message to display
    private handleApplicationMessage(message?: string): void {
        if(message) {
            // Restart the timeout
            if(this.timeOut) this.clearTimeout();
            this.timeOut = setTimeout(this.handleApplicationMessage, 5000);
            this.setState({message});
        } else {
            this.clearTimeout();
            this.setState({message: null});
        }
    }

    // Sets the status of the CasparCG Server
    private updateCasparStatus(
        event: Electron.IpcRendererEvent, 
        res: {status: boolean, launchTime: Date}
    ): void {
        const log: Log = {
            message: res.status 
                ? 'CasparCG Server is Running'
                : 'CasparCG is Stopping',
            error: false,
            date: new Date()
        }
        switch(res.status) {
            case true: 
            case false:
                return this.setState({
                    status: res.status, 
                    launchTime: new Date(res.launchTime),
                    logs: [...this.state.logs, log],
                    startup: true,
                    startupLogs: [],
                    version: null
                });
            default: 
                // Display an error
                this.handleApplicationMessage('Error updating CasparCG Server Status');
                break;
        }
    }

    // Receive a log from the CasparCG Server
    // and saves it in a orm the app can use
    private handleServerLog(
        event: Electron.IpcRendererEvent,
        res: {message: string}
    ): void {
        const log: Log = {
            message: res.message.replace(/\[(.*?)\]/g, ''),
            error: false,
            date: new Date()
        }
        const startupLogs = this.state.startupLogs;
        if(res.message.toLowerCase().includes('error')) log.error = true;
        if(this.state.startup) {
            if(res.message.includes('Received message')) {
                this.setState({startup: false});
            } else {
                startupLogs.push(log);
            }
        }
        return this.setState({logs: [...this.state.logs, log], startupLogs});
    }

    // Clears all the logs from the Server
    private clearLogs() {
        return this.setState({logs: []});
    }

    componentDidUpdate() {
        // If there is no version, ask for it
        if(this.state.status && this.state.version === null) {
            IPC.send('request-caspar-info');
            IPC.once('reply-caspar-info', (
                event: Electron.IpcRendererEvent, 
                res: {version: string}
            ) => this.setState({version: res.version}));
            // Set the version's state to not null so the update does 
            // not keep firing
            this.setState({version: ''});
        }
    }

    componentDidMount() {
        // Set a route to listen for CasparCG server changes
        IPC.on('caspar-connection', this.updateCasparStatus);
        // Set the route to listen for CasparCG Server Logs
        IPC.on('casparcg-server-log', this.handleServerLog);
        // Ask if CasparCG Server is running
        IPC.send('request-caspar-status', null);
        // Wait for Backend Responce
        IPC.once('reply-caspar-status', (
            event: Electron.IpcRendererEvent, 
            res: {status: boolean, error?: string, launchTime?: Date}
        ) => {
            if(res.error) {
                this.handleApplicationMessage(res.error);
            } else if(res.status) {
                // Set the local status of the CasparCg Server
                this.updateCasparStatus(event, {status: true, launchTime: res.launchTime});
            }
        });
    }

    componentWillUnmount() {
        // Remove the server change listener
        // The app will re-attach it and update the server status
        // when it is remounted
        IPC.removeListener('caspar-connection', this.updateCasparStatus);
        // Remove the route to listen for CasparCG Server Logs
        IPC.removeListener('casparcg-server-log', this.handleServerLog);
    }

    render() {
        return (
            <Router>
                <Header status={this.state.status}/>
                <Nav redirect={this.state.redirect}/>
                { /* Main Routing for the Application */ }
                <Switch>
                    <Route path="/configuration">
                        <main>
                            <p>Config</p>
                        </main>
                    </Route>
                    <Route path="/console">
                        <ConsolePage 
                            status={this.state.status} 
                            logs={this.state.logs}
                            startupLogs={this.state.startupLogs}
                            IPC={IPC}
                            clearLogs={this.clearLogs}
                            handleApplicationMessage={this.handleApplicationMessage}
                        />
                    </Route>
                    <Route path="/">
                        <ServerPage 
                            status={this.state.status} 
                            launchTime={this.state.launchTime}
                            version={this.state.version}
                            IPC={IPC} 
                            handleApplicationMessage={this.handleApplicationMessage}/>
                    </Route>
                </Switch>
                <div className={this.state.message ? "message-board visible" : "message-board"}>
                    <p>{this.state.message}</p>
                </div>
            </Router>
        )
    }
}