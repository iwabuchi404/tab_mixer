import React from 'react';
import styles from './DragHandle.module.css';

const DragHandle = ({ attributes, listeners, isSelected, className = "" }) => {
    return (
        <div
            className={`${styles.dragHandle} ${isSelected ? styles.selected : ''} ${className}`}
            {...attributes}
            {...listeners}
            data-drag-handle="true"
        >
            <svg
                width="8"
                height="16"
                viewBox="0 0 8 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.dragIcon}
            >
                <circle cx="2" cy="3" r="1" fill="currentColor" />
                <circle cx="6" cy="3" r="1" fill="currentColor" />
                <circle cx="2" cy="8" r="1" fill="currentColor" />
                <circle cx="6" cy="8" r="1" fill="currentColor" />
                <circle cx="2" cy="13" r="1" fill="currentColor" />
                <circle cx="6" cy="13" r="1" fill="currentColor" />
            </svg>
        </div>
    );
};

export default React.memo(DragHandle);
