import * as React from "react";

interface ButtonProps {
    ClickHandler: (event: React.MouseEvent<HTMLButtonElement>, param?: string) => void;
    param?: string;
    text: string;
    active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ClickHandler, param, text, active = false}) => (
    <button className={active ? 'active' : 'inactive'} onClick={e => ClickHandler(e, param)}>
        {text}
    </button>
)