// TabItem.jsx
import React, { useState, useRef } from 'react';
import styles from './TabItem.module.css';
import DropdownMenu from './DropdownMenu';
import GroupDialog from './GroupDialog';
import { CHROME_COLORS } from './GroupDialog';

const TabItem = ({ tabDate, windowId, isDragging = false, existingGroups = [], onTabReorder }) => {
  const [faviconError, setFaviconError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // タブデータの安全性チェック
  if (!tabDate || !tabDate.id) {
    console.warn('Invalid tab data:', tabDate);
    return null;
  }

  const mousedownEvent = (e, tabId, windowId) => {
    if (e.button == 1) {
      e.preventDefault();
      closeTab(tabId);
    }
    return
  }

  // タブをアクティブにする関数
  const activateTab = async (tabId, windowId) => {
    // ドラッグ中は操作を無効化
    if (isDragging) return;

    try {
      // ウィンドウ情報を取得
      const window = await chrome.windows.get(windowId);
      // ウィンドウをアクティブにする
      const updateParams = { focused: true };
      // 最小化されている場合のみ通常状態に戻す
      if (window.state === 'minimized') {
        updateParams.state = 'normal';
      }
      // まずウィンドウをアクティブにしてParamsを渡す
      await chrome.windows.update(windowId, updateParams);

      // その後、タブをアクティブにする
      await chrome.tabs.update(tabId, { active: true });

    } catch (error) {
      console.error('Error activating tab:', error);
    }
  };

  // タブを閉じる関数
  const closeTab = async (tabId) => {
    // ドラッグ中は操作を無効化
    if (isDragging) return;

    try {
      await chrome.tabs.remove(tabId);
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  };

  // 新しいグループを作成
  const handleCreateNewGroup = async ({ name, color }) => {
    try {
      const groupId = await chrome.tabs.group({ tabIds: [tabDate.id] });
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
        tabIds: [tabDate.id],
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
      await chrome.tabs.ungroup([tabDate.id]);
      if (onTabReorder) onTabReorder();
    } catch (error) {
      console.error('Failed to remove from group:', error);
    }
  };

  // メニュー項目を生成
  const getMenuItems = () => {
    const items = [
      {
        label: '新規グループ',
        icon: '📁',
        onClick: () => setDialogOpen(true)
      }
    ];

    // 既存グループがある場合
    if (existingGroups.length > 0) {
      items.push({
        label: 'グループに追加',
        icon: '📂',
        submenu: existingGroups.map(group => ({
          label: group.title || 'Untitled',
          icon: CHROME_COLORS.find(c => c.value === group.color)?.icon || '⚫',
          onClick: () => handleAddToGroup(group.id)
        }))
      });
    }

    // 既にグループに属している場合
    if (tabDate.groupId !== -1) {
      items.push({
        label: 'グループ解除',
        icon: '🔓',
        onClick: handleRemoveFromGroup
      });
    }

    return items;
  };

  return (
    <div
      key={tabDate.id}
      className={`${styles.tabItem} ${tabDate.active ? styles.activeTab : ''} ${tabDate.highlighted ? styles.highlighted : ''} ${isDragging ? styles.dragging : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.tabContent}>
        {tabDate.favIconUrl && !faviconError ? (
          <img
            className={styles.favicon}
            src={tabDate.favIconUrl}
            alt={tabDate.title || 'Tab'}
            onError={() => setFaviconError(true)}
          />
        ) : (
          <div className={styles.defaultFavicon} />
        )}
        <button
          onClick={() => activateTab(tabDate.id, windowId)}
          onMouseDown={(e) => mousedownEvent(e, tabDate.id, windowId)}
          className={styles.tabTitle}
          title={tabDate.title || 'Untitled Tab'}
          disabled={isDragging}
        >
          {tabDate.title || 'Untitled Tab'}
        </button>

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

      </div>

      {menuOpen && (
        <DropdownMenu
          items={getMenuItems()}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      )}

      {dialogOpen && (
        <GroupDialog
          mode="create"
          onConfirm={(data) => {
            setDialogOpen(false);
            handleCreateNewGroup(data);
          }}
          onCancel={() => setDialogOpen(false)}
        />
      )}

      <button
        onClick={() => closeTab(tabDate.id)}
        className={styles.closeButton}
        disabled={isDragging}
        aria-label="Close tab"
      >
      </button>
    </div>
  );
};

export default TabItem;