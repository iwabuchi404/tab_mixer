import React, { useState, useEffect } from 'react';  // Vue.jsでいう { ref, onMounted } from 'vue'
import TabList from './component/TabList';
import Header from './component/header';
import Footer from './component/footer';

const Popup = () => {
  const [windowTabs, setWindowTabs] = useState([]);
  const [allTabCount, setallTabCount] = useState(0);
  const [groups, setgroups] = useState({});

  const updateTabs = async () => {
    // 全てのウィンドウのタブを取得
    const allTabs = await chrome.tabs.query({});
    setallTabCount(allTabs.length);

    // アクティブなタブを持つウィンドウを特定
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeWindowId = currentTab[0]?.windowId;

    // タブグループの情報を取得
    const groups = await chrome.tabGroups.query({});
    const groupsMap = groups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
    setgroups(groupsMap);

    // タブをウィンドウIDでグループ化
    const tabsByWindow = allTabs.reduce((acc, tab) => {
      if (!acc[tab.windowId]) {
        acc[tab.windowId] = {
          tabs: [],
          groups: {},
          ungroupedTabs: [],
          focused: false
        };
      }
      acc[tab.windowId].tabs.push(tab);
      return acc;
    }, {});

    // 各ウィンドウの focused 状態を取得
    const windows = await chrome.windows.getAll();

    windows.forEach(window => {
      if (tabsByWindow[window.id]) {
        tabsByWindow[window.id].focused = window.focused;
      }
    });

    // ウィンドウごとのタブ情報を配列に変換
    const sortedWindows = Object.entries(tabsByWindow).map(([windowId, data]) => ({
      windowId: parseInt(windowId),
      groups: data.groups,
      tabs: data.tabs,
      focused: data.focused,
      currentWindow: activeWindowId === parseInt(windowId)
    })).sort((window) => {
      return window.windowId == activeWindowId ? -1 : 1;
    });

    console.log('sortedWindows');
    console.log(sortedWindows);

    setWindowTabs(sortedWindows);
  };
  // Vue: onMounted(() => { updateTabs() })
  useEffect(() => {
    updateTabs();

    // タブの変更を監視（Vue.jsのwatch相当）
    chrome.tabs.onCreated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onUpdated.addListener(updateTabs);
    chrome.tabs.onActivated.addListener(updateTabs);
    chrome.tabGroups.onCreated.addListener(updateTabs);
    chrome.tabGroups.onUpdated.addListener(updateTabs);
    chrome.tabGroups.onRemoved.addListener(updateTabs);

    // クリーンアップ関数（Vue.jsのonUnmounted相当）
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
  }, []); // 空の依存配列は、Vue.jsのonMountedと同じタイミングで実行

  return (
    <div className="w-96">
      <Header />
      {windowTabs.map(window => (
        <TabList
          key={window.windowId}
          tabList={window.tabs}
          groups={groups}
          windowId={window.windowId}
          listTitle={`Window ID:${window.windowId}`}
          focused={window.focused}
          currentWindow={window.currentWindow} />
      ))}

      <Footer windowCount={windowTabs.length} allTabCount={allTabCount} />
    </div>
  );
};

export default Popup;