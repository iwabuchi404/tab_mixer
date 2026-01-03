import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import TabList from './component/TabList';
import Header from './component/header';
import Footer from './component/footer';
import TabItem from './component/TabItem';
import { CHROME_COLORS } from './component/GroupDialog';
import styles from './Popup.module.css';

const Popup = () => {
  const [windowTabs, setWindowTabs] = useState([]); // 元のタブリスト
  const [displayTabs, setDisplayTabs] = useState([]); // 表示用タブリスト
  const [allTabCount, setallTabCount] = useState(0);
  const [groups, setgroups] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterMode, setFilterMode] = useState(false);
  const [activeDragTab, setActiveDragTab] = useState(null);
  const [activeDragGroup, setActiveDragGroup] = useState(null);
  const [isSidePanelMode, setIsSidePanelMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // タブの状態を更新
  const updateTabs = async () => {
    try {
      const allTabs = await chrome.tabs.query({});
      setallTabCount(allTabs.length);

      // 現在アクティブなウィンドウIDを取得
      const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeWindowId = currentTab[0]?.windowId;

      // タブグループを取得
      const groups = await chrome.tabGroups.query({});
      const groupsMap = groups.reduce((acc, group) => {
        acc[group.id] = {
          ...group,
          tabs: []  // 各グループに所属するタブを格納
        };
        return acc;
      }, {});
      setgroups(groupsMap);

      // ウィンドウごとにタブをグループ化
      const tabsByWindow = allTabs.reduce((acc, tab) => {
        // ウィンドウ用の要素がない場合初期化
        if (!acc[tab.windowId]) {
          acc[tab.windowId] = {
            windowId: tab.windowId,
            focused: false,
            currentWindow: tab.windowId === activeWindowId,
            groups: {},        // グループ化されたタブ
            tabs: [], // グループ化されていないタブ
            order: []         // タブの表示順序を保持
          };
        }

        // タブをグループまたは未グループリストに追加
        if (tab.groupId !== -1) {
          if (!acc[tab.windowId].groups[tab.groupId]) {
            acc[tab.windowId].groups[tab.groupId] = {
              ...groupsMap[tab.groupId],
              tabs: []
            };
          }
          acc[tab.windowId].groups[tab.groupId].tabs.push(tab);
        } else {
          acc[tab.windowId].tabs.push(tab);
        }

        // 表示順序を保持
        // グループの場合はグループID、タブの場合はタブIDを保持　直前と同じGroupの場合は追加しない
        if (acc[tab.windowId].order.length === 0 || acc[tab.windowId].order[acc[tab.windowId].order.length - 1].id !== tab.groupId
          || tab.groupId === -1 || acc[tab.windowId].order[acc[tab.windowId].order.length - 1].type === 'tab') {
          acc[tab.windowId].order.push({
            type: tab.groupId !== -1 ? 'group' : 'tab',
            id: tab.groupId !== -1 ? tab.groupId : tab.id
          });
        }

        return acc;
      }, {});

      // 各グループ内のタブをインデックス順にソート
      Object.values(tabsByWindow).forEach(window => {
        Object.values(window.groups).forEach(group => {
          group.tabs.sort((a, b) => a.index - b.index);
        });
        window.tabs.sort((a, b) => a.index - b.index);
      });

      const windows = await chrome.windows.getAll();
      windows.forEach(window => {
        if (tabsByWindow[window.id]) {
          tabsByWindow[window.id].focused = window.focused;
        }
      });

      const sortedWindows = Object.entries(tabsByWindow).map(([windowId, data]) => ({
        windowId: parseInt(windowId),
        groups: data.groups,
        tabs: data.tabs,
        focused: data.focused,
        currentWindow: activeWindowId === parseInt(windowId),
        highlighted: false,
        order: data.order
      })).sort((window) => {
        return window.windowId == activeWindowId ? -1 : 1;
      });
      setWindowTabs(sortedWindows);
      applySearch(sortedWindows, searchText, filterMode);

    } catch (error) {
      console.error('Error updating tabs:', error);
      // エラー時は空配列にセット
      setWindowTabs([]);
      setDisplayTabs([]);
    }
  };

  // 検索とフィルタリングを適用
  const applySearch = (tabs, search, isFilterMode) => {
    if (!search) {
      setDisplayTabs(tabs);
      return;
    }

    const searchLower = search.toLowerCase();
    const processedTabs = tabs.map(window => {
      if (isFilterMode) {
        // フィルターモード: マッチするタブのみを表示
        const filteredTabs = window.tabs.filter(tab => {
          return tab.title.toLowerCase().includes(searchLower) ||
            tab.url.toLowerCase().includes(searchLower);
        });
        return { ...window, tabs: filteredTabs };
      } else {
        // ハイライトモード: 全タブを表示し、マッチするタブをハイライト
        const highlightedTabs = window.tabs.map(tab => {
          const isMatch = tab.title.toLowerCase().includes(searchLower) ||
            tab.url.toLowerCase().includes(searchLower);
          return { ...tab, highlighted: isMatch };
        });
        return { ...window, tabs: highlightedTabs };
      }
    });

    // フィルターモードの場合、タブが空のウィンドウを除外
    const finalTabs = isFilterMode
      ? processedTabs.filter(window => window.tabs.length > 0)
      : processedTabs;

    setDisplayTabs(finalTabs);
  };

  // 設定を読み込む
  const loadStatus = async () => {
    try {
      const settings = await chrome.storage.local.get(['searchText', 'filterMode', 'isSidePanelMode']);
      if (settings.searchText) {
        setSearchText(settings.searchText);
      }
      if (settings.filterMode) {
        setFilterMode(settings.filterMode);
      }
      if (settings.isSidePanelMode !== undefined) {
        setIsSidePanelMode(settings.isSidePanelMode);

        // 緊急回避: サイドパネルモード設定中にポップアップとして開かれた場合、即座に閉じる
        // これにより、遷移時や誤操作による二重開きを防ぐ
        try {
          const currentWin = await chrome.windows.getCurrent();
          if (settings.isSidePanelMode && currentWin.type === 'popup') {
            window.close();
            return;
          }
        } catch (e) {
          console.warn('Error checking window type:', e);
        }

        // 起動時にもポップアップの状態を同期
        if (chrome.action && chrome.action.setPopup) {
          await chrome.action.setPopup({ popup: settings.isSidePanelMode ? "" : "popup.html" });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // 設定を保存
  const saveStatus = async (newSearchText, newFilterMode) => {
    try {
      await chrome.storage.local.set({
        searchText: newSearchText,
        filterMode: newFilterMode,
        isSidePanelMode: isSidePanelMode
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // 検索テキスト変更時の処理
  const handleSearchChange = (newSearchText) => {
    setSearchText(newSearchText);
    saveStatus(newSearchText, filterMode);
    applySearch(windowTabs, newSearchText, filterMode);
  };

  // フィルターモード変更時の処理
  const handleFilterModeChange = (newFilterMode) => {
    setFilterMode(newFilterMode);
    saveStatus(searchText, newFilterMode);
    applySearch(windowTabs, searchText, newFilterMode);
  };

  // サイドパネルモード変更時の処理
  const handleSidePanelModeChange = async (newMode) => {
    setIsSidePanelMode(newMode);
    try {
      await chrome.storage.local.set({ isSidePanelMode: newMode });

      // 1. まず動作設定を更新
      if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: newMode });
      }

      // 2. ポップアップの有無を更新（二重開き防止のため空に設定）
      if (chrome.action && chrome.action.setPopup) {
        await chrome.action.setPopup({ popup: newMode ? "" : "popup.html" });
      }

      if (newMode) {
        // ポップアップ -> サイドパネルへ
        // メインのブラウザウィンドウを取得
        const browserWindow = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });

        // サイドパネルを開く
        if (chrome.sidePanel && chrome.sidePanel.open) {
          try {
            await chrome.sidePanel.open({ windowId: browserWindow.id });
          } catch (e) {
            console.error('Failed to open side panel:', e);
          }
        }

        // 自身（ポップアップ）を閉じる
        setTimeout(() => window.close(), 100);
      } else {
        // サイドパネル -> ポップアップへ
        // ポップアップを開き直す
        if (chrome.action && chrome.action.openPopup) {
          try {
            await chrome.action.openPopup();
          } catch (e) {
            console.error('Failed to open popup:', e);
          }
        }
        // サイドパネル自身を閉じる
        window.close();
      }
    } catch (error) {
      console.error('Error setting side panel behavior:', error);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const { type, tabData, groupInfo } = active.data.current || {};

    if (type === 'tab') {
      setActiveDragTab(tabData);
    } else if (type === 'group') {
      setActiveDragGroup(groupInfo);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragTab(null);
    setActiveDragGroup(null);

    if (!over || active.id === over.id) {
      return;
    }

    const { type: activeType } = active.data.current || {};

    // 移動先の情報を特定
    let targetWindowId, targetIndex, targetGroupId = -1;

    for (const window of windowTabs) {
      // 1. オーバーしたのがタブの場合
      let tabIndex = window.tabs.findIndex(t => t.id === over.id);
      if (tabIndex !== -1) {
        targetWindowId = window.windowId;
        targetIndex = window.tabs[tabIndex].index;
        targetGroupId = -1;
        break;
      }

      // 2. オーバーしたのがグループ内のタブの場合
      for (const groupId in window.groups) {
        tabIndex = window.groups[groupId].tabs.findIndex(t => t.id === over.id);
        if (tabIndex !== -1) {
          targetWindowId = window.windowId;
          targetIndex = window.groups[groupId].tabs[tabIndex].index;
          targetGroupId = parseInt(groupId);
          break;
        }
      }

      // 3. オーバーしたのがグループタイトルの場合
      if (window.groups[over.id]) {
        targetWindowId = window.windowId;
        // グループの最初のタブのインデックスを使用
        const groupTabs = window.groups[over.id].tabs;
        targetIndex = groupTabs.length > 0 ? groupTabs[0].index : 0;
        targetGroupId = -1; // ヘッダーにドロップした場合はグループに入れない（グループの直上に移動）
        break;
      }

      if (targetWindowId) break;
    }

    if (targetWindowId === undefined) return;

    try {
      if (activeType === 'tab') {
        // タブの移動ロジック
        let sourceWindowId, sourceGroupId = -1;
        for (const window of windowTabs) {
          if (window.tabs.find(t => t.id === active.id)) {
            sourceWindowId = window.windowId;
            break;
          }
          for (const groupId in window.groups) {
            if (window.groups[groupId].tabs.find(t => t.id === active.id)) {
              sourceWindowId = window.windowId;
              sourceGroupId = parseInt(groupId);
              break;
            }
          }
          if (sourceWindowId) break;
        }

        if (sourceWindowId !== targetWindowId) {
          await chrome.tabs.move(active.id, { windowId: targetWindowId, index: targetIndex });
        } else {
          await chrome.tabs.move(active.id, { index: targetIndex });
        }

        if (sourceGroupId !== targetGroupId) {
          if (targetGroupId !== -1) {
            await chrome.tabs.group({ tabIds: active.id, groupId: targetGroupId });
          } else {
            await chrome.tabs.ungroup(active.id);
          }
        }
      } else if (activeType === 'group') {
        // グループの移動ロジック
        await chrome.tabGroups.move(active.id, { windowId: targetWindowId, index: targetIndex });
      }

      updateTabs();
    } catch (error) {
      console.error('Failed to move item:', error);
      updateTabs();
    }
  };

  const handleDragCancel = () => {
    setActiveDragTab(null);
    setActiveDragGroup(null);
  };

  useEffect(() => {
    updateTabs();

    chrome.tabs.onCreated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onUpdated.addListener(updateTabs);
    chrome.tabs.onActivated.addListener(updateTabs);
    chrome.tabGroups.onCreated.addListener(updateTabs);
    chrome.tabGroups.onUpdated.addListener(updateTabs);
    chrome.tabGroups.onRemoved.addListener(updateTabs);

    // ストレージから設定を読み込む
    loadStatus();

    return () => {
      chrome.tabs.onCreated.removeListener(updateTabs);
      chrome.tabs.onRemoved.removeListener(updateTabs);
      chrome.tabs.onUpdated.removeListener(updateTabs);
      chrome.tabs.onActivated.removeListener(updateTabs);
      chrome.windows.onFocusChanged.removeListener(updateTabs);
      chrome.tabGroups.onCreated.removeListener(updateTabs);
      chrome.tabGroups.onUpdated.removeListener(updateTabs);
      chrome.tabGroups.onRemoved.removeListener(updateTabs);
    };
  }, []);

  // タブの更新後に検索を再適用
  useEffect(() => {
    if (searchText) {
      applySearch(windowTabs, searchText, filterMode);
    }
  }, [windowTabs]);

  return (
    <div className={`${styles.popupMain} ${isSidePanelMode ? styles.sidePanelMode : ''}`}>
      <Header
        searchText={searchText}
        setSearchText={handleSearchChange}
        onFilterModeChange={handleFilterModeChange}
        filterMode={filterMode}
        isSidePanelMode={isSidePanelMode}
        onSidePanelModeChange={handleSidePanelModeChange}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={styles.container}>
          {displayTabs.length > 0 ? (
            displayTabs.map(window => (
              <TabList
                key={window.windowId}
                tabList={window.tabs}
                order={window.order}
                groups={window.groups}
                windowId={window.windowId}
                listTitle={`Window ID:${window.windowId}`}
                focused={window.focused}
                currentWindow={window.currentWindow}
                filterMode={filterMode}
                existingGroups={Object.values(groups)}
                onTabReorder={updateTabs}
              />
            ))
          ) : (
            <div className={styles.empty}>
              <p>No tabs found.</p>
            </div>
          )}
          <Footer windowCount={displayTabs.length} allTabCount={allTabCount} />
        </div>
        <DragOverlay>
          {activeDragTab ? (
            <div className={styles.dragOverlay}>
              <TabItem
                tabDate={activeDragTab}
                windowId={activeDragTab.windowId}
                isDragging={true}
              />
            </div>
          ) : activeDragGroup ? (
            <div className={styles.dragOverlay}>
              <div className={styles.groupDragPreview}>
                <span
                  className={styles.groupFolderIcon}
                  style={{ color: CHROME_COLORS.find(c => c.value === activeDragGroup.color)?.hex || '#1a73e8' }}
                >
                  📁
                </span>
                <span className={styles.groupTitlePreview}>
                  {activeDragGroup.title || 'Tab Group'}
                </span>
                <span className={styles.groupCountPreview}>
                  ({activeDragGroup.tabs.length} tabs)
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Popup;