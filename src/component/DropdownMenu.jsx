// DropdownMenu.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './DropdownMenu.module.css';

const DropdownMenu = ({ items, onClose, anchorRef }) => {
    const menuRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (anchorRef && anchorRef.current && menuRef.current) {
            const anchorRect = anchorRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            let top = anchorRect.bottom + window.scrollY;
            let left = anchorRect.right - menuRect.width + window.scrollX;

            // 画面下端からはみ出る場合は上に表示
            if (anchorRect.bottom + menuRect.height > windowHeight) {
                top = anchorRect.top + window.scrollY - menuRect.height;
            }

            setCoords({ top, left });
        }
    }, [anchorRef]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                anchorRef.current && !anchorRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', onClose, true); // スクロール時も閉じる

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', onClose, true);
        };
    }, [onClose, anchorRef]);

    const handleItemClick = (item) => {
        if (item.disabled) return;

        if (!item.submenu) {
            item.onClick();
            onClose();
        }
    };

    return createPortal(
        <div
            ref={menuRef}
            className={styles.menu}
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                position: 'absolute'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => (
                <div key={index}>
                    <button
                        className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                    >
                        {item.icon && <span className={styles.icon}>{item.icon}</span>}
                        <span className={styles.label}>{item.label}</span>
                        {item.submenu && <span className={styles.arrow}>›</span>}
                    </button>

                    {item.submenu && (
                        <div className={styles.submenu}>
                            {item.submenu.map((subItem, subIndex) => (
                                <button
                                    key={subIndex}
                                    className={styles.menuItem}
                                    onClick={() => {
                                        subItem.onClick();
                                        onClose();
                                    }}
                                >
                                    {subItem.icon && <span className={styles.icon}>{subItem.icon}</span>}
                                    <span className={styles.label}>{subItem.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>,
        document.body
    );
};

export default DropdownMenu;
