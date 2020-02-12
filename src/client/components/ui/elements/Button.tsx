import * as React from "react";

interface ButtonProps {
    ClickHandler: (event: React.MouseEvent<HTMLButtonElement>, param?: string) => void;
    param?: string;
    text: string;
    active?: boolean;
}

// A button element that can take a click event, 
// a paramenter for the event,
// the text to display, 
// and if the button show be displayed as 'active' or not
export const Button: React.FC<ButtonProps> = ({ClickHandler, param, text, active = false}) => (
    <button 
        className={active ? 'active' : 'inactive'} 
        onClick={e => ClickHandler(e, param)}
    >
        {text}
    </button>
)