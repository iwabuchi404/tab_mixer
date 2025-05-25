// TabItem.jsx
import React from 'react';
import styles from './TabItem.module.css';

const TabItem = ({ tabDate, windowId, isDragging = false }) => {
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

    console.log('activateTab', tabId, windowId);
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

  return (
    <div
      key={tabDate.id}
      className={`${styles.tabItem} ${tabDate.active ? styles.activeTab : ''} ${tabDate.highlighted ? styles.highlighted : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.tabContent}>
        {tabDate.favIconUrl && (
          <img
            className={styles.favicon}
            src={tabDate.favIconUrl}
            alt={tabDate.title || 'Tab'}
            onError={(e) => e.target.style.display = 'none'}
          />
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
      </div>
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