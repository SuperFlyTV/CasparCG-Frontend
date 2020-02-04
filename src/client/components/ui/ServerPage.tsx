import * as React from "react";
import '../../scss/ui/landing-page.scss';

// Component Imports
import { Button } from './elements/Button';
import { CasparIcon } from './icons/generated/CasparCG';

interface LandingPageProps {
    status: boolean;
    launchTime: Date;
    IPC: Electron.IpcRenderer
}

interface LandingPageState {
    upTime: number[];
    version: string;
    configuration: boolean;
}

export default class LandingPage extends React.Component<LandingPageProps, LandingPageState> {
    
    constructor(props: LandingPageProps) {
        super(props);
        this.startServerUpTime = this.startServerUpTime.bind(this);
        this.resetServerUptime = this.resetServerUptime.bind(this);
    }

    state: LandingPageState = {
        upTime: [0],
        version: '',
        configuration: false,
    }

    private commands = [
        {
            short: 'diag',
            command: 'DIAG'
        }, {
            short: 'thumb',
            command: 'THUMBNAIL GENERATE_ALL'
        }
    ];

    private timer: NodeJS.Timeout;

    protected handleResartServer = () => {
        if(this.props.status) {
            this.props.IPC.send('request-caspar-connection', {shouldConnect: false});
            this.props.IPC.once('caspar-connection', (
                event: Electron.IpcRendererEvent, 
                res: {status: boolean, launchTime: Date}
            ): void => {
                this.props.IPC.send('request-caspar-connection', {shouldConnect: true});
            });
        }
    }

    protected handleServerCommand = (e: React.MouseEvent, cmd: string) => {
        const index = this.commands.findIndex(command => command.short === cmd);
        if(index >= 0) {
            this.props.IPC.send('request-caspar-command', {command: this.commands[index].command});
            this.props.IPC.once('reply-caspar-command', (
                event: Electron.IpcRendererEvent, 
                res: {result: boolean}
            ): void => {
                // handle show user that command worked
            });
        } else {
            // Handle Error
        }
    }

    protected updateServerConnection = () => {
        if(!this.props.status) {
            this.props.IPC.send('request-caspar-connection', {shouldConnect: true});
        } else if(this.props.status) {
            this.props.IPC.send('request-caspar-connection', {shouldConnect: false});
        } else {
            // Handle Error
        }
    }

    protected tick = () => {
        const upTime: number[] = this.state.upTime;
        upTime[0]++;
        this.setState({upTime});
    }

    protected startServerUpTime = () => {
        const upTime: number[] = this.state.upTime;
        // Run previous code before starting timer.
        const startTimer = () => setInterval(this.tick, 1000);

        if(this.props.launchTime) {
            const date = new Date();
            upTime[0] = Math.ceil((date.getTime() - this.props.launchTime.getTime()) / 1000);
        }
        this.timer = startTimer();
        return this.setState({
            upTime
        });
    }

    protected resetServerUptime = () => {
        clearInterval(this.timer);
        this.timer = null;
        return this.setState({
            upTime: [0],
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
            this.startServerUpTime();
            return this.setState({
                configuration: true
            });
        }
    }

    componentWillUnmount() {
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
                    <p>{this.state.upTime[0]}</p>
                    <p>Version</p>
                    <p>{this.state.version.length ? this.state.version : 'Unknown'}</p>
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