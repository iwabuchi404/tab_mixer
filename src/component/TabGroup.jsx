// TabGroup.jsx
import React, { useState, useRef } from 'react';
import styles from './TabGroup.module.css';
import DropdownMenu from './DropdownMenu';
import GroupDialog from './GroupDialog';
import GroupCloseDialog from './GroupCloseDialog';
import ExpandIcon from './ExpandIcon';
import CloseIcon from './CloseIcon';
import { CHROME_COLORS } from './GroupDialog';

const TabGroup = ({ groupInfo, children, className = '', defaultOpenState = true, onGroupUpdate }) => {
    const [isOpen, setIsOpen] = useState(defaultOpenState);
    const [isHovered, setIsHovered] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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
            if (tabIds.length > 0) {
                await chrome.tabs.ungroup(tabIds);
            }
            if (onGroupUpdate) onGroupUpdate();
        } catch (error) {
            console.error('Failed to ungroup all:', error);
        }
    };

    // タブをすべて閉じる
    const handleCloseAllTabs = async () => {
        try {
            const tabs = await chrome.tabs.query({ groupId: groupInfo.id });
            const tabIds = tabs.map(t => t.id);
            if (tabIds.length > 0) {
                await chrome.tabs.remove(tabIds);
            }
            if (onGroupUpdate) onGroupUpdate();
        } catch (error) {
            console.error('Failed to close all tabs:', error);
        }
    };

    const getGroupMenuItems = () => [
        {
            label: 'Rename',
            icon: '✏️',
            onClick: () => setDialogOpen(true)
        },
        {
            label: 'Change Color',
            icon: '🎨',
            onClick: () => setDialogOpen(true)
        },
        {
            label: 'Ungroup',
            icon: '🔓',
            onClick: handleUngroupAll
        },
        {
            label: 'Close Group',
            icon: '🗑️',
            onClick: () => setConfirmDialogOpen(true)
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
                <div className={styles.groupHeaderLeft} onClick={() => setIsOpen(!isOpen)}>
                    <span className={styles.groupTitleText}>
                        {groupInfo.title || 'Tab Group'}
                    </span>
                    <ExpandIcon
                        isOpen={isOpen}
                        onClick={() => setIsOpen(!isOpen)}
                        className={styles.toggleIcon}
                    />
                </div>

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
                <CloseIcon
                    onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialogOpen(true);
                    }}
                    className={styles.groupCloseButton}
                    ariaLabel="Close group"
                />
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

            {confirmDialogOpen && (
                <GroupCloseDialog
                    groupTitle={groupInfo.title}
                    onUngroup={() => {
                        setConfirmDialogOpen(false);
                        handleUngroupAll();
                    }}
                    onCloseTabs={() => {
                        setConfirmDialogOpen(false);
                        handleCloseAllTabs();
                    }}
                    onCancel={() => setConfirmDialogOpen(false)}
                />
            )}

            <div className={`${styles.groupTabs} ${isOpen ? styles.open : ''}`}>
                {children}
            </div>
        </div >
    );
};

export default TabGroup;