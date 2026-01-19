// TabItem.jsx
import React, { useState, useRef } from 'react';
import styles from './TabItem.module.css';
import DropdownMenu from './DropdownMenu';
import GroupDialog from './GroupDialog';
import CloseIcon from './CloseIcon';
import { CHROME_COLORS } from './GroupDialog';

const TabItem = ({ tabData, windowId, isDragging = false, existingGroups = [], onTabReorder, className = "" }) => {
  const [faviconError, setFaviconError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // タブデータの安全性チェック
  if (!tabData || !tabData.id) {
    console.warn('Invalid tab data:', tabData);
    return null;
  }

  const mousedownEvent = (e, tabId, windowId) => {
    if (e.button == 1) {
      e.preventDefault();
      handleCloseTab(tabId);
    }
    return
  }

  // タブをアクティブにする関数
  const handleTabClick = async () => {
    // ドラッグ中は操作を無効化
    if (isDragging) return;

    try {
      const window = await chrome.windows.get(windowId);
      const updateParams = { focused: true };
      if (window.state === 'minimized') {
        updateParams.state = 'normal';
      }
      await chrome.windows.update(windowId, updateParams);
      await chrome.tabs.update(tabData.id, { active: true });
    } catch (error) {
      console.error('Error activating tab:', error);
    }
  };

  // タブを閉じる関数
  const handleCloseTab = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isDragging) return;

    try {
      await chrome.tabs.remove(tabData.id);
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  };

  // 新しいグループを作成
  const handleCreateNewGroup = async ({ name, color }) => {
    try {
      const groupId = await chrome.tabs.group({ tabIds: [tabData.id] });
      await chrome.tabGroups.update(groupId, {
        title: name,
        color: color
      });
      if (onTabReorder) onTabReorder();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  // 既存グループに追加
  const handleAddToGroup = async (groupId) => {
    try {
      await chrome.tabs.group({
        tabIds: [tabData.id],
        groupId: groupId
      });
      if (onTabReorder) onTabReorder();
    } catch (error) {
      console.error('Failed to add to group:', error);
    }
  };

  // グループから解除
  const handleRemoveFromGroup = async () => {
    try {
      await chrome.tabs.ungroup([tabData.id]);
      if (onTabReorder) onTabReorder();
    } catch (error) {
      console.error('Failed to remove from group:', error);
    }
  };

  // メニュー項目を生成
  const getMenuItems = () => {
    const items = [
      {
        label: 'New Group',
        icon: '📁',
        onClick: () => setDialogOpen(true)
      }
    ];

    if (existingGroups.length > 0) {
      items.push({
        label: 'Add to Group',
        icon: '📂',
        submenu: existingGroups.map(group => ({
          label: group.title || 'Untitled',
          icon: CHROME_COLORS.find(c => c.value === group.color)?.icon || '⚫',
          onClick: () => handleAddToGroup(group.id)
        }))
      });
    }

    if (tabData.groupId !== -1) {
      items.push({
        label: 'Ungroup',
        icon: '🔓',
        onClick: handleRemoveFromGroup
      });
    }

    return items;
  };

  return (
    <div
      className={`${styles.tabItem} ${tabData.active ? styles.activeTab : ''} ${tabData.highlighted ? styles.highlighted : ''} ${isDragging ? styles.dragging : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.tabContent}>
        {tabData.favIconUrl && !faviconError ? (
          <img
            className={styles.favicon}
            src={tabData.favIconUrl}
            alt=""
            onError={() => setFaviconError(true)}
          />
        ) : (
          <div className={styles.defaultFavicon} />
        )}
        <button
          onClick={handleTabClick}
          onMouseDown={(e) => mousedownEvent(e, tabData.id, windowId)}
          className={styles.tabTitle}
          title={tabData.url || tabData.title || 'Untitled Tab'}
          disabled={isDragging}
        >
          {tabData.title || 'Untitled Tab'}
        </button>
      </div>

      <div className={styles.tabActions}>
        {(isHovered || menuOpen) && !isDragging && (
          <button
            ref={menuButtonRef}
            className={`${styles.menuButton} ${menuOpen ? styles.visible : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Menu"
          >
            ⋮
          </button>
        )}

        <CloseIcon
          onClick={handleCloseTab}
          className={styles.closeButton}
          ariaLabel="Close tab"
        />

        {menuOpen && (
          <DropdownMenu
            items={getMenuItems()}
            onClose={() => setMenuOpen(false)}
            anchorRef={menuButtonRef}
          />
        )}
      </div>

      {dialogOpen && (
        <GroupDialog
          mode="create"
          initialName=""
          onConfirm={(data) => {
            setDialogOpen(false);
            handleCreateNewGroup(data);
          }}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default TabItem;