import * as React from "react";

interface StatusProps {
    isActive: boolean;
}

export const StatusIcon: React.FC<StatusProps> = ({isActive}) => (
    <svg 
        className="status-icon"
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"> 
        {/* Base */}
        <path d="M50 90 H20 L40 65 H60 L80 90 Z" strokeWidth="0px" fill="white"/>
        {/* Pulse */}
        <path className={isActive ? 'active' : 'inactive'} d="M5 38 H35 L40 30 L49 45 L60 23 L70 38 H95" fill="none" strokeWidth="5px"/>
        {/* Screen */}
        <rect x="5" y="10" width="90" height="55" rx="5" ry="5" fill="none" strokeWidth="5px"/>
    </svg>
)
    