import * as React from "react";
import '../../scss/ui/landing-page.scss';

// Component Imports
import { Button } from './elements/Button';
import { CasparIcon } from './icons/generated/CasparCG';

interface LandingPageProps {
    // If the CasparCG server is running or not
    status: boolean;
    launchTime: Date;
    version: string;
    // The object used to communicate with the apps backend server
    IPC: Electron.IpcRenderer;
    handleApplicationMessage: (message?: string) => void;
}

interface LandingPageState {
    upTime: number;
    // If the config is valid or not
    configuration: boolean;
}

export default class LandingPage extends React.Component<LandingPageProps, LandingPageState> {
    
    constructor(props: LandingPageProps) {
        super(props);
        this.startServerUpTime = this.startServerUpTime.bind(this);
        this.convertUpTime = this.convertUpTime.bind(this);
        this.resetServerUptime = this.resetServerUptime.bind(this);
    }

    state: LandingPageState = {
        upTime: 0,
        configuration: false,
    }

    // Predefined commands 
    private commands = [
        {
            short: 'diag',
            command: 'DIAG'
        }, {
            short: 'thumb',
            command: 'THUMBNAIL GENERATE_ALL'
        }
    ];

    // Timer for counting uptime
    private timer: NodeJS.Timeout;

    // Attempts to restart the CasparCG server
    protected handleResartServer = () => {
        if(this.props.status) {
            // Send terminate request
            this.props.IPC.send('request-caspar-connection', {shouldConnect: false});
            this.props.handleApplicationMessage('Restarting Server');
            this.props.IPC.once('caspar-connection', (
                event: Electron.IpcRendererEvent, 
                res: {status: boolean, launchTime: Date}
            ): void => {
                // Send startup request after a half second delay 
                // to allow previous instance to close
                setTimeout(() => {
                    this.props.IPC.send('request-caspar-connection', {shouldConnect: true});
                }, 500);
            });
        } else {
            this.props.handleApplicationMessage('Server must be running to before it can be restarted. Did you mean "Start Server"?');
        }
    }

    // Attempts to run a command in CasparCG server
    protected handleServerCommand = (e: React.MouseEvent, cmd: string) => {
        if(!this.props.status) {
            this.props.handleApplicationMessage('Server must be running before executing a command');
            return;
        }
        // Find the command
        const index = this.commands.findIndex(command => command.short === cmd);
        if(index >= 0) {
            // Request to run the command
            this.props.IPC.send('request-caspar-command', {command: this.commands[index].command});
            this.props.IPC.once('reply-caspar-command', (
                event: Electron.IpcRendererEvent, 
                res: {result: boolean}
            ): void => {
                // handle show user that command worked
            });
        } else {
            this.props.handleApplicationMessage('Error executing command');
        }
    }

    // Stop or start the CasparCg server
    protected updateServerConnection = () => {
        if(!this.props.status) {
            this.props.IPC.send('request-caspar-connection', {shouldConnect: true});
            this.props.handleApplicationMessage('Attempting to Start Server');
        } else {
            this.props.IPC.send('request-caspar-connection', {shouldConnect: false});
            this.props.handleApplicationMessage('Attempting to Stop Server');
        }
        this.props.IPC.once('reply-caspar-connection', (
            event: Electron.IpcRendererEvent, 
            res: {status: boolean, error?: string}
        ) => {
            if(res.error) {
                this.props.handleApplicationMessage(res.error);
            }
        });
    }

    // Advance the time CasparCG serer has been running
    protected tick = () => {
        let upTime: number = this.state.upTime;
        upTime++;
        this.setState({upTime});
    }

    // Begin counting how long the server has been running
    protected startServerUpTime = () => {
        let upTime: number = this.state.upTime;
        // Run previous code before starting timer.
        const startTimer = () => setInterval(this.tick, 1000);

        // Calculate the luanch time based on the current time
        if(this.props.launchTime) {
            const date = new Date();
            upTime = Math.ceil((date.getTime() - this.props.launchTime.getTime()) / 1000);
        }
        // Set and start the timer
        this.timer = startTimer();
        return this.setState({
            upTime
        });
    }

    // Calculates and formates the uptime of the CasparCG server
    private convertUpTime = () => {
        let sec_num: number = parseInt(this.state.upTime.toString(), 10);
        let hours: number | string   = Math.floor(sec_num / 3600);
        let minutes: number | string = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds: number | string = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    }

    // Stop counting and reset the server's up time
    protected resetServerUptime = () => {
        clearInterval(this.timer);
        this.timer = null;
        return this.setState({
            upTime: 0,
            configuration: false
        });
    }

    componentDidUpdate() {
        if(this.timer && !this.props.status) {
            this.resetServerUptime();
        } else if(!this.timer && this.props.status) {
            this.startServerUpTime();  
            return this.setState({
                configuration: true
            }); 
        }   
    }

    componentDidMount() {
        if(this.timer && !this.props.status) {
            this.resetServerUptime();
        } else if(!this.timer && this.props.status) {
            // Starts the timer
            this.startServerUpTime();
            return this.setState({
                configuration: true
            });
        }
    }

    componentWillUnmount() {
        // Romoves the setInterval: timer
        this.resetServerUptime();
    }

    render() {
        const isActive = this.props.status ? true : false;
        return (
            <main className="landing-page">

                <CasparIcon isActive={isActive}/>
                <h2>{isActive ? 'Connected and Running' : 'Server Stopped'}</h2>

                {/* Server Details */}
                <div className="server-details">
                    <p>Uptime</p>
                    <p>{this.convertUpTime()}</p>
                    <p>Version</p>
                    <p>{this.props.version ? this.props.version : 'Unknown'}</p>
                </div>
                <p>{this.state.configuration ? 'Valid Configuration' : 'Invalid Configuration'}</p>
                
                {/* Server Controls */}
                <div className="controls">
                    <Button 
                        ClickHandler={this.updateServerConnection} 
                        text={isActive ? "Stop Server" : "Start Server"} 
                        active={true} />
                    <Button 
                        ClickHandler={this.handleResartServer} 
                        text="Restart Server" 
                        active={isActive} />
                    <Button 
                        ClickHandler={this.handleServerCommand} 
                        param="diag" 
                        text="View Diagnostics" 
                        active={isActive} />
                    <Button 
                        ClickHandler={this.handleServerCommand} 
                        param="thumb" 
                        text="Generate Thumbnails" 
                        active={isActive} />
                </div>
            </main>
        )
    }
}