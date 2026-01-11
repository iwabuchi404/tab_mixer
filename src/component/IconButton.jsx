import React from 'react';
import styles from './IconButton.module.css';

const IconButton = ({
    children,
    onClick,
    active = false,
    title = "",
    className = ""
}) => {
    return (
        <button
            className={`${styles.iconButton} ${active ? styles.active : ''} ${className}`}
            onClick={onClick}
            title={title}
        >
            {children}
        </button>
    );
};

export default IconButton;
