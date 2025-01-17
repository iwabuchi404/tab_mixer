import React, { useState, useEffect } from 'react';
import TabList from './component/TabList';
import Header from './component/header';
import Footer from './component/footer';
import styles from './Popup.module.css';

const Popup = () => {
  const [windowTabs, setWindowTabs] = useState([]); // 元のタブリスト
  const [displayTabs, setDisplayTabs] = useState([]); // 表示用タブリスト
  const [allTabCount, setallTabCount] = useState(0);
  const [groups, setgroups] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterMode, setFilterMode] = useState(false);

  // タブの状態を更新
  const updateTabs = async () => {
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

    console.log('updateTabs', sortedWindows);
    console.log('groups', groups);
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
      const settings = await chrome.storage.local.get(['searchText', 'filterMode']);
      if (settings.searchText) {
        setSearchText(settings.searchText);
      }
      if (settings.filterMode) {
        setFilterMode(settings.filterMode);
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
        filterMode: newFilterMode
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
    <div className={styles.popuoMain}>
      <Header
        searchText={searchText}
        setSearchText={handleSearchChange}
        onFilterModeChange={handleFilterModeChange}
        filterMode={filterMode}
      />
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
            />
          ))
        ) : (
          <div className={styles.empty}>
            <p>No tabs found.</p>
          </div>
        )}
        <Footer windowCount={displayTabs.length} allTabCount={allTabCount} />
      </div>
    </div>
  );
};

export default Popup;