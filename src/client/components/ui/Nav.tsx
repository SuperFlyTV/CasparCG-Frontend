import * as React from "react";
import { NavLink } from 'react-router-dom';

// Component Imports
import { CasparIcon } from './icons/generated/CasparCG';
import { ConsoleIcon } from './icons/custom/ConsoleIcon';

interface NavProps {
    redirect?: string;
}

interface NavState {
    activePage: string
}

export default class Nav extends React.Component<NavProps, NavState> {
    state: NavState = {
        activePage: 'landing'
    }

    render() {
        return (
            <nav>
                <NavLink exact to={'/'}>
                    <CasparIcon />
                    <p>Server</p>
                </NavLink>
                <NavLink to={'/console'}>
                    <ConsoleIcon />
                    <p>Console</p>
                </NavLink>
            </nav>
        )
    }
}