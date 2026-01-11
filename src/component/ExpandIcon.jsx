// ExpandIcon.jsx
import React from 'react';
import styles from './ExpandIcon.module.css';

const ExpandIcon = ({ isOpen, onClick, className = '', ariaLabel = '' }) => {
    return (
        <button
            className={`${styles.expandButton} ${isOpen ? styles.open : ''} ${className}`}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick(e);
                }
            }}
            aria-label={ariaLabel || (isOpen ? "Collapse" : "Expand")}
            type="button"
        >
            <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.svgIcon}
            >
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
    );
};

export default ExpandIcon;
