// TabGroup.jsx
import React, { useState, useRef } from 'react';
import styles from './TabGroup.module.css';
import DropdownMenu from './DropdownMenu';
import MenuButton from './MenuButton';
import GroupDialog from './GroupDialog';
import GroupCloseDialog from './GroupCloseDialog';
import ExpandIcon from './ExpandIcon';
import CloseIcon from './CloseIcon';
import { CHROME_COLORS } from './GroupDialog';

const TabGroup = ({
    groupInfo,
    children,
    className = '',
    defaultOpenState = true,
    onGroupUpdate,
    isSelected,
    onSelect,
    isOpen: controlledIsOpen,
    onToggle,
    headerOnly = false
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpenState);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const toggleOpen = () => {
        if (onToggle) {
            onToggle(!isOpen);
        } else {
            setInternalIsOpen(!isOpen);
        }
    };

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

    // グループ内のすべてのタブをスリープ状態にする
    const handleSleepAllTabs = async () => {
        try {
            const tabs = await chrome.tabs.query({ groupId: groupInfo.id });
            const discardableTabs = tabs.filter(t => !t.active && !t.discarded);

            if (discardableTabs.length > 0) {
                // ポップアップが閉じるのを防ぐため、少しずつ遅延させて実行
                for (const tab of discardableTabs) {
                    await chrome.tabs.discard(tab.id);
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                if (onGroupUpdate) onGroupUpdate();
            }
        } catch (error) {
            console.error('Failed to sleep all tabs in group:', error);
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
        },
        {
            label: 'Sleep Group',
            icon: '💤',
            onClick: handleSleepAllTabs
        }
    ];

    // 色の値をhexコードに変換
    const groupColorHex = CHROME_COLORS.find(c => c.value === groupInfo.color)?.hex || '#1a73e8';

    const handleHeaderClick = (e) => {
        if (onSelect) {
            onSelect(groupInfo.id, e, 'group');
        }
    };

    return (
        <div className={`${styles.groupContainer} ${className}`}>
            <h3 className={`${styles.groupTitle} ${isSelected ? styles.selected : ''}`}
                style={{
                    '--group-color': groupColorHex,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleHeaderClick}
                data-group-id={groupInfo.id}
            >
                <div className={styles.groupHeaderLeft}>
                    <span className={styles.groupTitleText}>
                        {groupInfo.title || 'Tab Group'}
                    </span>
                    <ExpandIcon
                        isOpen={isOpen}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleOpen();
                        }}
                        className={styles.toggleIcon}
                    />
                </div>

                <div className={styles.menuContainer}>
                    {(isHovered || menuOpen) && (
                        <MenuButton
                            ref={menuButtonRef}
                            isOpen={menuOpen}
                            onClick={() => setMenuOpen(!menuOpen)}
                        />
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

            {!headerOnly && (
                <div className={`${styles.groupTabs} ${isOpen ? styles.open : ''}`}>
                    {children}
                </div>
            )}
        </div >
    );
};

export default React.memo(TabGroup);