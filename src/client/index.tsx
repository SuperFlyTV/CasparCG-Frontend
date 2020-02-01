import * as React from "react";
import * as ReactDOM from "react-dom";
import './scss/index.scss';

import {Header} from './components/Header'; 

ReactDOM.render(
    <div><Header status="disconnected" /></div>,
    document.querySelector('body')
);