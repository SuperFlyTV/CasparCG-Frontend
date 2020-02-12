import * as React from "react";
import '../../scss/ui/console-page.scss';

// Component Imports
import { Button } from './elements/Button';

// Interface for a CasparCG Log
interface Log {
    message: string;
    error: boolean;
    date: Date;
}

interface ConsolePageProps {
    status: boolean;
    logs: Log[];
    startupLogs: Log[];
    IPC: Electron.IpcRenderer;
    clearLogs: () => void;
    handleApplicationMessage: (message?: string) => void;
}

interface ConsolePageState {
    filter: string | null;
    startup: boolean
    console: string;
    prevCommand: string;
    autoScroll: boolean;
}


export default class ConsolePage extends React.Component<ConsolePageProps, ConsolePageState> {

    constructor(props: ConsolePageProps) {
        super(props);
        this.handleServerCommand = this.handleServerCommand.bind(this);
        this.handleConsoleUpdate = this.handleConsoleUpdate.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleFilterLogs = this.handleFilterLogs.bind(this);
        this.showStartupLogs = this.showStartupLogs.bind(this);
        this.handleDisplayLog = this.handleDisplayLog.bind(this);
        this.handleAutoScroll = this.handleAutoScroll.bind(this);
    }

    state: ConsolePageState = {
        filter: null,
        startup: false,
        console: '',
        prevCommand: null,
        autoScroll: true
    }

    // Reserved commands that should only be used via the application
    // Not the standard command input
    protected ReservedCommands: string[] = [
        'q', 
        'exit',
        'restart' // all above quits the server and should not be entered as a command
    ];

    // Attempts to run a command in CasparCG server
    protected handleServerCommand (cmd: string): void {
        if(!cmd.length) {
            this.props.handleApplicationMessage('Please enter a command first');
            return;
        }
        const reserved = this.ReservedCommands.findIndex(c => c === cmd.trim());
        if(reserved < 0) {
            // Send the command to the backend
            this.props.IPC.send('request-caspar-command', {command: cmd});
            this.props.IPC.once('reply-caspar-command', (
                event: Electron.IpcRendererEvent, 
                res: {result: boolean}
            ): void => {
                // Console Logs will display result of command
                return this.setState({console: '', prevCommand: cmd});
            });
        } else {
            this.props.handleApplicationMessage(`'${cmd}' is a reserved command that can only be used by the application itself.`);
        }
    }

    // Updates the console command
    // @param {object} event - On Change event object from an input element
    protected handleConsoleUpdate(event: React.ChangeEvent<HTMLInputElement>): void {
        return this.setState({console: event.target.value});
    }

    // Check to see if the user tried to run a command
    // Or if they want a the previous command
    // @param {object} event - The Key Press event from an input element
    protected handleKeyPress(event: React.KeyboardEvent): void {
        if(event.key === 'Enter') {
            // If server is connected, run command
            if(this.props.status) {
                this.handleServerCommand(this.state.console.trim());
            // Warn the user the server is not connected
            } else {
                this.props.handleApplicationMessage('Commands can only be ran when the server is running');
            }
        } else if(event.key === 'ArrowUp') {
            if(this.state.prevCommand && this.state.console !== this.state.prevCommand) {
                this.setState({console: this.state.prevCommand});
            } else if(this.state.prevCommand === null) {
                this.props.handleApplicationMessage('No previous command found.');
            } else {
                this.setState({console: ''});
            }
        }
    }

    // Filters the logs by error, startup, or nothing
    // @param {object} event - The on click event object
    // @param {string} filter - The filter to apply
    private handleFilterLogs(event: React.MouseEvent, filter: string): void {
        if(filter === this.state.filter) return this.setState({filter: null});
        switch(filter) {
            case 'errors':
                return this.setState({filter: 'errors'});
            case 'noerrors':
                return this.setState({filter: 'noerrors'});
            default:

                return this.setState({filter: null});
        }
    }

    // Displays only the startup logs
    private showStartupLogs(): void {
        return this.setState({startup: this.state.startup ? false : true});
    }

    // Builds out a log to be used in the DOM
    // @param {object} log - The log info to be used
    // @param {number} i - The index of the log to be used as the element's key
    // @returns {DOM Element | null} -  If the element matches the filters, it is returned
    //                                  Else, null is returned
    private handleDisplayLog(log: Log, i: number): React.ReactElement | null {
        // Build date and time of log
        let time = log.date.getHours() + ':' ;
        time += (log.date.getMinutes() < 10  
            ? ('0' + log.date.getMinutes()) 
            : log.date.getMinutes()) + ':';
        time += log.date.getSeconds() < 10
            ? ('0' + log.date.getSeconds()) 
            : log.date.getSeconds();
        let date = (log.date.getMonth() + 1 ) + '/' 
            + log.date.getDate() + '/'
            + log.date.getFullYear();

        // Ensure the log should be shown
        if(this.state.filter) {
            if(this.state.filter === 'errors') {
                if(!log.error) return null;
            } else {
                if(log.error) return null;
            }
        }
        return (
            <div key={i} className={log.error ? 'log error': 'log'}>
                <p>{time + ' ' + date}</p>
                <p>{log.message}</p>
            </div>
        )
    }

    // Attempts to scroll the logs div to the bottom 
    // if autoscroll is set to true
    // @param {object} event - UI Event from scrolling on the div
    private handleAutoScroll(event: React.UIEvent<HTMLDivElement>) {
        const logs = document.querySelector('.console-page .logs');
        const scroll: number = logs.scrollTop +  logs.clientHeight;
        if(scroll === logs.scrollHeight && !this.state.autoScroll) {
            return this.setState({autoScroll: true});
        } else if(scroll < logs.scrollHeight - 20 && this.state.autoScroll) {
            return this.setState({autoScroll: false});
        }
    }

    // Scrolls to the obttom of the logs div
    private setScrollHeight() {
        const logs = document.querySelector('.console-page .logs');
        logs.scrollTop = logs.scrollHeight;
    }

    componentDidUpdate() {
        if(this.state.autoScroll) this.setScrollHeight();
    }

    componentDidMount() {
        this.setScrollHeight();
    }

    render() {
        return (
            <main className="console-page">
                <div className="controls">
                    <Button 
                        ClickHandler={this.props.clearLogs} 
                        text={'Clear Logs'} 
                        active={this.props.logs.length ? true : false} />
                    <Button 
                        ClickHandler={this.handleFilterLogs} 
                        param={"errors"}
                        text={'Filter Errors'} 
                        active={this.state.filter !== 'errors'} />
                    <Button 
                        ClickHandler={this.handleFilterLogs} 
                        param={"noerrors"}
                        text={'Filter No Errors'} 
                        active={this.state.filter !== 'noerrors'} />
                    <Button 
                        ClickHandler={this.showStartupLogs} 
                        text={'View Startup Logs'} 
                        active={this.state.startup ? false : true} />
                </div>
                <div className="logs" onScroll={this.handleAutoScroll}>
                    {this.state.startup === false && this.props.logs.map((log: Log, i: number) => 
                        this.handleDisplayLog(log, i))}
                    {this.state.startup === true && this.props.startupLogs.map((log: Log, i: number) => 
                        this.handleDisplayLog(log, i))}
                </div>
                <div className="console-input">
                    <label>Server Input</label>
                    <input 
                        type="text" 
                        onChange={this.handleConsoleUpdate}
                        onKeyDown={this.handleKeyPress}
                        placeholder="Type Command Here - Press Enter to Execute Command"
                        value={this.state.console}
                    />
                </div>
            </main>
        )
    }
}