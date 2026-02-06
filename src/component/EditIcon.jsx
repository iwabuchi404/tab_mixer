// EditIcon.jsx
import React from 'react';
import styles from './EditIcon.module.css';

const EditIcon = ({ onClick, className = '', ariaLabel = '' }) => {
    return (
        <button
            className={`${styles.editButton} ${className}`}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick(e);
                }
            }}
            aria-label={ariaLabel || "Edit name"}
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    );
};

export default EditIcon;
