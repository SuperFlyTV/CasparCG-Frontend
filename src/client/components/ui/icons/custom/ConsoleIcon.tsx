import * as React from "react";

interface CasparProps {
    isActive?: boolean;
}

export const ConsoleIcon: React.FC<CasparProps> = ({isActive}) => (
    <svg 
        className="console-icon"
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"> 
        {/* Button Page */}
        <g>
            <rect x="30" y="15" width="60" height="80" rx="5" ry="5" strokeWidth="1.5%"/>
            <line x1="35" y1="30" x2="80" y2="30" strokeWidth="2%" strokeLinecap="round"/>
            <line x1="35" y1="45" x2="80" y2="45" strokeWidth="2%" strokeLinecap="round"/>
            <line x1="35" y1="60" x2="80" y2="60" strokeWidth="2%" strokeLinecap="round"/>
            <line x1="35" y1="75" x2="80" y2="75" strokeWidth="2%" strokeLinecap="round"/>
        </g>
        {/* Top Page */}
        <g>
            <rect x="15" y="5" width="60" height="80" rx="5" ry="5" strokeWidth="1.5%"/>
            <line x1="25" y1="20" x2="65" y2="20" strokeWidth="2%" strokeLinecap="round"/>
            <line x1="25" y1="35" x2="65" y2="35" strokeWidth="2%" strokeLinecap="round"/>
            <line x1="25" y1="50" x2="65" y2="50" strokeWidth="2%" strokeLinecap="round"/>
            <line x1="25" y1="65" x2="65" y2="65" strokeWidth="2%" strokeLinecap="round"/>
        </g>
    </svg>
)