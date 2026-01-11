// CloseIcon.jsx
import React from 'react';
import styles from './CloseIcon.module.css';

const CloseIcon = ({ onClick, className = '', ariaLabel = '' }) => {
    return (
        <button
            className={`${styles.closeButton} ${className}`}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick(e);
                }
            }}
            aria-label={ariaLabel || "Close"}
            type="button"
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.svgIcon}
            >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    );
};

export default CloseIcon;
