import React, { forwardRef } from 'react';
import styles from './MenuButton.module.css';

const MenuButton = forwardRef(({ onClick, isOpen, className = "" }, ref) => {
    return (
        <button
            ref={ref}
            className={`${styles.menuButton} ${isOpen ? styles.visible : ''} ${className}`}
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
            aria-label="Menu"
        >
            ⋮
        </button>
    );
});

MenuButton.displayName = 'MenuButton';

export default MenuButton;
