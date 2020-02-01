import * as React from "react";

interface HeaderProps { status: string }

export class Header extends React.Component<HeaderProps, {}> {
    render() {
        return (
            <header><h1>Newer!</h1></header>
        )
    }
}

