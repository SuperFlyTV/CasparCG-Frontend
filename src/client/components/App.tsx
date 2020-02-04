import * as React from "react";

import {ipcRenderer as IPC} from "electron";
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

// Component Imports
import Header from './ui/Header';
import Nav from './ui/Nav';
import ServerPage from './ui/ServerPage';

interface AppState {
    status: boolean;
    launchTime: Date | null;
    redirect?: string
}

export default class App extends React.Component<{}, AppState> {
    constructor(props: object) {
        super(props);
        this.updateCasparStatus = this.updateCasparStatus.bind(this);
    }

    state: AppState = {
        status: false,
        launchTime: null
    }

    private updateCasparStatus(
        event: Electron.IpcRendererEvent, 
        res: {status: boolean, launchTime: Date}
    ): void {
        switch(res.status) {
            case true: 
            case false:
                this.setState({status: res.status, launchTime: new Date(res.launchTime)});
                break;
            default: 
                // Handle Error
                break;
        }
    }

    componentDidMount() {
        IPC.on('caspar-connection', this.updateCasparStatus);

        IPC.send('request-caspar-status', null);
        IPC.once('reply-caspar-status', (
            event: Electron.IpcRendererEvent, 
            res: {status: boolean, error?: boolean, launchTime?: Date}
        ) => {
            if(res.error) {
                // Handle Error
            } else if(res.status) {
                this.updateCasparStatus(event, {status: true, launchTime: res.launchTime});
            }
        });
    }

    componentWillUnmount() {
        IPC.removeListener('caspar-connection', this.updateCasparStatus);
    }

    render() {
        return (
            <Router>
                <Header status={this.state.status}/>
                <Nav redirect={this.state.redirect}/>
                <Switch>
                    <Route path="/configuration">
                        <main>
                            <p>Config</p>
                        </main>
                    </Route>
                    <Route path="/console">
                        <main>
                            <p>Console</p>
                        </main>
                    </Route>
                    <Route path="/">
                        <ServerPage 
                            status={this.state.status} 
                            launchTime={this.state.launchTime}
                            IPC={IPC} />
                    </Route>
                </Switch>
            </Router>
        )
    }
}