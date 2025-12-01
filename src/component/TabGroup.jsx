// TabGroup.jsx
import React, { useState, useRef } from 'react';
import styles from './TabGroup.module.css';
import DropdownMenu from './DropdownMenu';
import GroupDialog from './GroupDialog';
import { CHROME_COLORS } from './GroupDialog';

const TabGroup = ({ groupInfo, children, className = '', defaultOpenState = true, onGroupUpdate }) => {
    const [isOpen, setIsOpen] = useState(defaultOpenState);
    const [isHovered, setIsHovered] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const menuButtonRef = useRef(null);

    // グループ名を編集
    const handleEditName = async ({ name, color }) => {
        try {
            await chrome.tabGroups.update(groupInfo.id, {
                title: name,
                color: color
            });
            if (onGroupUpdate) onGroupUpdate();
        } catch (error) {
            console.error('Failed to update group:', error);
        }
    };

    // グループ色を変更
    const handleChangeColor = async (color) => {
        try {
            await chrome.tabGroups.update(groupInfo.id, {
                color: color
            });
            if (onGroupUpdate) onGroupUpdate();
        } catch (error) {
            console.error('Failed to update group color:', error);
        }
    };

    // グループ解除（全タブ）
    const handleUngroupAll = async () => {
        try {
            const tabs = await chrome.tabs.query({ groupId: groupInfo.id });
            const tabIds = tabs.map(t => t.id);
            await chrome.tabs.ungroup(tabIds);
            if (onGroupUpdate) onGroupUpdate();
        } catch (error) {
            console.error('Failed to ungroup all:', error);
        }
    };

    const getGroupMenuItems = () => [
        {
            label: '名前を編集',
            icon: '✏️',
            onClick: () => setDialogOpen(true)
        },
        {
            label: '色を変更',
            icon: '🎨',
            submenu: CHROME_COLORS.map(color => ({
                label: color.name,
                icon: color.icon,
                onClick: () => handleChangeColor(color.value)
            }))
        },
        {
            label: 'グループ解除',
            icon: '🔓',
            onClick: handleUngroupAll
        }
    ];

    // 色の値をhexコードに変換
    const groupColorHex = CHROME_COLORS.find(c => c.value === groupInfo.color)?.hex || '#1a73e8';

    return (
        <div className={`${styles.groupContainer} ${className}`}>
            <h3 className={styles.groupTitle}
                style={{
                    '--group-color': groupColorHex,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <button
                    className={styles.groupTitleInner}
                    onClick={() => setIsOpen(!isOpen)}>
                    {groupInfo.title || 'Tab Group'}
                    <span className={`${styles.toggleIcon} ${isOpen ? styles.open : ''}`}>
                        ▼
                    </span>
                </button >

                <div className={styles.menuContainer}>
                    {(isHovered || menuOpen) && (
                        <button
                            ref={menuButtonRef}
                            className={styles.menuButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(!menuOpen);
                            }}
                        >
                            ⋮
                        </button>
                    )}

                    {menuOpen && (
                        <DropdownMenu
                            items={getGroupMenuItems()}
                            onClose={() => setMenuOpen(false)}
                            anchorRef={menuButtonRef}
                        />
                    )}
                </div>
            </h3>

            {dialogOpen && (
                <GroupDialog
                    mode="edit"
                    initialName={groupInfo.title}
                    initialColor={groupInfo.color}
                    onConfirm={(data) => {
                        setDialogOpen(false);
                        handleEditName(data);
                    }}
                    onCancel={() => setDialogOpen(false)}
                />
            )}

            <div className={`${styles.groupTabs} ${isOpen ? styles.open : ''}`}>
                {children}
            </div>
        </div >
    );
};

export default TabGroup;