// TabList.jsx
import React, { useState, useEffect } from 'react';  // Vue.jsでいう { ref, onMounted } from 'vue'
import styles from './TabItem.module.css';

const TabItem = ({ tabDate, windowId }) => {

  const mousedownEvent = (e, tabId, windowId) => {
    if (e.button == 1) {
      e.preventDefault();
      closeTab(tabId);
    }
    return
  }
  // タブをアクティブにする関数
  const activateTab = async (tabId, windowId) => {
    try {
      // まずウィンドウをアクティブにする
      await chrome.windows.update(windowId, {
        focused: true,
        // オプション: ウィンドウが最小化されている場合は元に戻す
        state: 'normal'
      });

      // その後、タブをアクティブにする
      await chrome.tabs.update(tabId, { active: true });

      // UI状態を更新
      updateTabs();
    } catch (error) {
      console.error('Error activating tab:', error);
    }
  };

  // タブを閉じる関数
  const closeTab = async (tabId) => {
    await chrome.tabs.remove(tabId);
    updateTabs();
  };

  return (
    <div key={tabDate.id}
      className={`${styles.tabItem} ${tabDate.active ? styles.activeTab : ''} ${tabDate.highlighted ? styles.highlighted : ''}`}
    >
      {tabDate.highlighted}
      <div className={styles.tabContent}>
        {tabDate.favIconUrl && (
          <img
            className={styles.favicon}
            src={tabDate.favIconUrl}
            alt={tabDate.title}
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <button
          onClick={() => activateTab(tabDate.id, windowId)}
          onMouseDown={(e) => mousedownEvent(e, tabDate.id, windowId)}
          className={styles.tabTitle}
          title={tabDate.title}
        >
          {tabDate.title}
        </button>
      </div>
      <button
        onClick={() => closeTab(tabDate.id)}
        className={styles.closeButton}
      >
      </button>
    </div>
  );
};

export default TabItem;