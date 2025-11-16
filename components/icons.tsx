
import React from 'react';

interface IconProps {
    className?: string;
}

export const MicIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM11 5a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V5Z"></path>
        <path d="M7 12a1 1 0 0 0-1 1a5 5 0 0 0 5 5a5 5 0 0 0 5-5a1 1 0 0 0-2 0a3 3 0 0 1-3 3a3 3 0 0 1-3-3a1 1 0 0 0-1-1Z"></path>
    </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2zm0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16zm-3 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9z"></path>
    </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.711 7.711 0 0 1 12 15c1.542 0 2.986.464 4.175 1.254a7.711 7.711 0 0 1 4.175-1.254A9.75 9.75 0 0 0 12 2.25C6.615 2.25 2.25 6.615 2.25 12a9.75 9.75 0 0 0 3.895 7.812ZM15 9a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z" clipRule="evenodd" />
    </svg>
);

export const RiaIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.984 2.5a.75.75 0 0 1 .75.75v.322c3.132.223 5.75 2.84 5.75 5.978v.488a.75.75 0 0 1-1.5 0v-.488c0-2.43-1.97-4.4-4.4-4.4s-4.4 1.97-4.4 4.4v.488a.75.75 0 0 1-1.5 0v-.488c0-3.138 2.618-5.755 5.75-5.978V3.25a.75.75 0 0 1-.75-.75Zm8.016 8.5h-16a.75.75 0 0 0 0 1.5h16a.75.75 0 0 0 0-1.5Z" />
        <path fillRule="evenodd" d="M12 12.5a4.75 4.75 0 0 0-4.75 4.75v.564c0 .817.37 1.583.99 2.086l2.007 1.63c.91.742 2.18.742 3.09 0l2.008-1.63a2.53 2.53 0 0 0 .99-2.086v-.564A4.75 4.75 0 0 0 12 12.5Zm-3.25 5.314v-.564a3.25 3.25 0 1 1 6.5 0v.564a1.03 1.03 0 0 1-.403.85l-2.008 1.63a.68.68 0 0 1-.84 0l-2.007-1.63a1.03 1.03 0 0 1-.402-.85Z" clipRule="evenodd" />
    </svg>
);
