import * as React from "react";

// Component Imports
import { StatusIcon } from './icons/custom/StatusIcon';

interface HeaderProps { status: boolean }

export default class Header extends React.Component<HeaderProps, {}> {
    render() {
        return (
            <header>
                <h1>CasparCG Frontend</h1>
                {/* Display differently if CasparCG server is running or not */}
                <StatusIcon isActive={this.props.status ? true : false}/>
            </header>
        )
    }
}

