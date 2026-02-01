import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import TabList from './component/TabList';
import Header from './component/header';
import Footer from './component/footer';
import TabItem from './component/TabItem';
import DropdownMenu from './component/DropdownMenu';
import GroupDialog from './component/GroupDialog';
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
  const [selectedTabIds, setSelectedTabIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]); // New state for selected groups
  const [lastClickedId, setLastClickedId] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isLassoing, setIsLassoing] = useState(false);
  const isLassoingRef = useRef(false);
  const tabRectsCache = useRef([]);
  const lassoStartPos = useRef({ x: 0, y: 0 });
  const lassoStartScrollTop = useRef(0);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const footerMenuAnchorRef = useRef(null);
  const [isBulkGroupDialogOpen, setIsBulkGroupDialogOpen] = useState(false);
  const isInternalChange = useRef(false);
  const hasDragged = useRef(false);
  const scrollInterval = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

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
      })).sort((a, b) => {
        if (a.windowId === activeWindowId) return -1;
        if (b.windowId === activeWindowId) return 1;
        return 0;
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
      // 1. グループ内のタブをフィルター/ハイライト
      const processedGroups = {};
      Object.entries(window.groups).forEach(([groupId, group]) => {
        const processedGroupTabs = group.tabs.map(tab => {
          const isMatch = tab.title.toLowerCase().includes(searchLower) ||
            (tab.url && tab.url.toLowerCase().includes(searchLower));
          return isFilterMode ? (isMatch ? tab : null) : { ...tab, highlighted: isMatch };
        }).filter(t => t !== null);

        if (!isFilterMode || processedGroupTabs.length > 0) {
          processedGroups[groupId] = { ...group, tabs: processedGroupTabs };
        }
      });

      // 2. 独立したタブをフィルター/ハイライト
      const processedUngroupedTabs = window.tabs.map(tab => {
        const isMatch = tab.title.toLowerCase().includes(searchLower) ||
          (tab.url && tab.url.toLowerCase().includes(searchLower));
        return isFilterMode ? (isMatch ? tab : null) : { ...tab, highlighted: isMatch };
      }).filter(t => t !== null);

      // 3. 表示順序をフィルター（フィルターモード時のみ）
      const processedOrder = isFilterMode
        ? window.order.filter(item => {
          if (item.type === 'tab') return processedUngroupedTabs.some(t => t.id === item.id);
          if (item.type === 'group') return processedGroups[item.id] !== undefined;
          return false;
        })
        : window.order;

      return {
        ...window,
        tabs: processedUngroupedTabs,
        groups: processedGroups,
        order: processedOrder
      };
    });

    // フィルターモードの場合、表示すべきものが何もないウィンドウを除外
    const finalTabs = isFilterMode
      ? processedTabs.filter(window => window.tabs.length > 0 || Object.keys(window.groups).length > 0)
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

  // タブまたはグループ選択の処理 (Ctrl/Shift/通常クリック)
  const handleSelect = (id, event, type = 'tab') => {
    const isShift = event.shiftKey;
    const isCtrl = event.ctrlKey || event.metaKey;

    if (type === 'tab') {
      setSelectedTabIds(prev => {
        let next;
        if (isShift && lastClickedId !== null) {
          // タブの全IDリスト（表示順）を取得
          const allDisplayTabIds = displayTabs.flatMap(win => {
            return win.order.flatMap(item => {
              if (item.type === 'tab') return [item.id];
              if (item.type === 'group' && win.groups[item.id]) {
                return win.groups[item.id].tabs.map(t => t.id);
              }
              return [];
            });
          });

          const startIndex = allDisplayTabIds.indexOf(lastClickedId);
          const endIndex = allDisplayTabIds.indexOf(id);

          if (startIndex !== -1 && endIndex !== -1) {
            const rangeIds = allDisplayTabIds.slice(
              Math.min(startIndex, endIndex),
              Math.max(startIndex, endIndex) + 1
            );
            const newSet = new Set(isCtrl ? prev : []);
            rangeIds.forEach(tabId => newSet.add(tabId));
            next = Array.from(newSet);
          } else {
            next = isCtrl ? (prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]) : [id];
          }
        } else if (isCtrl) {
          next = prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id];
        } else {
          next = [id];
          setSelectedGroupIds([]); // 通常クリック時はグループ選択を解除
        }
        return next;
      });
      setLastClickedId(id);
    } else if (type === 'group') {
      setSelectedGroupIds(prev => {
        if (isCtrl) {
          return prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id];
        } else {
          setSelectedTabIds([]); // 通常クリック時はタブ選択を解除
          return [id];
        }
      });
    }
  };

  // ラッソ（ドラッグ）選択の開始
  const handleMouseDown = (e) => {
    // インタラクティブ要素の上なら無視
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;

    // ドラッグハンドルなら完全に無視（dnd-kitに任せる）
    if (e.target.closest('[data-drag-handle]')) return;

    // 背景をクリックした場合は選択解除
    const isTab = e.target.closest('[data-tab-id]');
    const isGroup = e.target.closest('[data-group-id]');
    if (!isTab && !isGroup && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      setSelectedTabIds([]);
      setSelectedGroupIds([]);
      setLastClickedId(null);
    }

    const scrollTopValue = window.pageYOffset || document.documentElement.scrollTop;
    setIsLassoing(true);
    isLassoingRef.current = true;
    lassoStartPos.current = { x: e.pageX, y: e.pageY };
    lassoStartScrollTop.current = scrollTopValue;
    setSelectionBox({
      startX: e.pageX,
      startY: e.pageY,
      currentX: e.pageX,
      currentY: e.pageY
    });

    // タブとグループの座標をキャッシュ
    const tabItems = document.querySelectorAll('[data-tab-id]');
    const groupItems = document.querySelectorAll('[data-group-id]');
    const cache = [];

    const scrollTopForItems = window.pageYOffset || document.documentElement.scrollTop;
    tabItems.forEach(el => {
      const rect = el.getBoundingClientRect();
      cache.push({
        id: Number(el.getAttribute('data-tab-id')),
        type: 'tab',
        rect: {
          left: rect.left,
          right: rect.right,
          top: rect.top + scrollTopForItems,
          bottom: rect.bottom + scrollTopForItems
        }
      });
    });

    groupItems.forEach(el => {
      const rect = el.getBoundingClientRect();
      cache.push({
        id: Number(el.getAttribute('data-group-id')),
        type: 'group',
        rect: {
          left: rect.left,
          right: rect.right,
          top: rect.top + scrollTop,
          bottom: rect.bottom + scrollTop
        }
      });
    });

    tabRectsCache.current = cache;
    hasDragged.current = false;
  };

  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isLassoingRef.current) return;

      const startX = lassoStartPos.current.x;
      const startY = lassoStartPos.current.y;
      const currentX = e.pageX;
      const currentY = e.pageY;

      mousePosRef.current = { x: e.clientX, y: e.clientY };

      setSelectionBox({
        startX,
        startY,
        currentX,
        currentY
      });

      // オートスクロール判定
      const scrollThreshold = 50;
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;

      if (mouseY < scrollThreshold || mouseY > viewportHeight - scrollThreshold) {
        if (!scrollInterval.current) {
          scrollInterval.current = setInterval(() => {
            const speed = 10;
            const direction = mousePosRef.current.y < scrollThreshold ? -1 : 1;
            window.scrollBy(0, direction * speed);

            // スクロール中も選択範囲を再計算
            const currentST = window.pageYOffset || document.documentElement.scrollTop;
            const currentSL = window.pageXOffset || document.documentElement.scrollLeft;
            updateLassoSelection(
              lassoStartPos.current.x,
              lassoStartPos.current.y,
              mousePosRef.current.x + currentSL, // page relative
              mousePosRef.current.y + currentST  // page relative
            );
          }, 16);
        }
      } else {
        if (scrollInterval.current) {
          clearInterval(scrollInterval.current);
          scrollInterval.current = null;
        }
      }

      updateLassoSelection(startX, startY, currentX, currentY);
    };

    const updateLassoSelection = (startX, startY, currentX, currentY) => {
      // 移動距離が十分な場合のみ、リアルタイムで選択状態を更新
      const dist = Math.sqrt(Math.pow(startX - currentX, 2) + Math.pow(startY - currentY, 2));
      if (dist > 5) {
        hasDragged.current = true;
        const rect = {
          left: Math.min(startX, currentX),
          top: Math.min(startY, currentY),
          right: Math.max(startX, currentX),
          bottom: Math.max(startY, currentY)
        };

        const newSelectedTabIds = [];
        const newSelectedGroupIds = [];

        tabRectsCache.current.forEach(item => {
          const r = item.rect;
          if (!(r.left > rect.right || r.right < rect.left || r.top > rect.bottom || r.bottom < rect.top)) {
            if (item.type === 'tab') {
              newSelectedTabIds.push(item.id);
            } else {
              newSelectedGroupIds.push(item.id);
            }
          }
        });

        setSelectedTabIds(prev => {
          if (prev.length === newSelectedTabIds.length && prev.every((id, i) => id === newSelectedTabIds[i])) {
            return prev;
          }
          return newSelectedTabIds;
        });

        setSelectedGroupIds(prev => {
          if (prev.length === newSelectedGroupIds.length && prev.every((id, i) => id === newSelectedGroupIds[i])) {
            return prev;
          }
          return newSelectedGroupIds;
        });
      }
    };

    const handleWindowMouseUp = (e) => {
      setIsLassoing(false);
      isLassoingRef.current = false;
      setSelectionBox(null);
      tabRectsCache.current = [];

      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }

      // ドラッグが発生していた場合、この後のクリックイベントを無効化する
      if (hasDragged.current) {
        const preventClick = (event) => {
          event.stopImmediatePropagation();
          event.preventDefault();
          window.removeEventListener('click', preventClick, true);
        };
        window.addEventListener('click', preventClick, true);
        // 万が一クリックが発生しなかった場合のためにタイマーでも解除
        setTimeout(() => window.removeEventListener('click', preventClick, true), 100);
      }
    };

    if (isLassoing) {
      isLassoingRef.current = true;
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isLassoing]);

  // Bulk operation handlers
  const handleFooterMenuClick = (anchorRef, e) => {
    e.stopPropagation();
    footerMenuAnchorRef.current = anchorRef.current;
    setFooterMenuOpen(true);
  };

  const handleCloseSelectedTabs = async () => {
    if (selectedTabIds.length === 0 && selectedGroupIds.length === 0) return;
    try {
      const tabsInSelectedGroups = [];
      for (const groupId of selectedGroupIds) {
        const tabs = await chrome.tabs.query({ groupId });
        tabsInSelectedGroups.push(...tabs.map(t => t.id));
      }
      const allTabIds = Array.from(new Set([...selectedTabIds, ...tabsInSelectedGroups]));

      if (allTabIds.length > 0) {
        await chrome.tabs.remove(allTabIds);
        setSelectedTabIds([]);
        setSelectedGroupIds([]);
        updateTabs();
      }
    } catch (error) {
      console.error('Failed to close selected tabs:', error);
    }
  };

  const handleMoveToNewWindow = async () => {
    if (selectedTabIds.length === 0 && selectedGroupIds.length === 0) return;
    try {
      const tabsInSelectedGroups = [];
      for (const groupId of selectedGroupIds) {
        const tabs = await chrome.tabs.query({ groupId });
        tabsInSelectedGroups.push(...tabs.map(t => t.id));
      }
      const allTabIds = Array.from(new Set([...selectedTabIds, ...tabsInSelectedGroups]));

      if (allTabIds.length > 0) {
        const [firstTabId, ...otherTabIds] = allTabIds;
        const newWindow = await chrome.windows.create({ tabId: firstTabId });
        if (otherTabIds.length > 0) {
          await chrome.tabs.move(otherTabIds, { windowId: newWindow.id, index: -1 });
        }
        setSelectedTabIds([]);
        setSelectedGroupIds([]);
        updateTabs();
      }
    } catch (error) {
      console.error('Failed to move selected tabs to new window:', error);
    }
  };

  const handleBulkAddToGroup = async (groupId) => {
    if (selectedTabIds.length === 0 && selectedGroupIds.length === 0) return;
    try {
      const tabsInSelectedGroups = [];
      for (const sgid of selectedGroupIds) {
        const tabs = await chrome.tabs.query({ groupId: sgid });
        tabsInSelectedGroups.push(...tabs.map(t => t.id));
      }
      const allTabIds = Array.from(new Set([...selectedTabIds, ...tabsInSelectedGroups]));

      if (allTabIds.length > 0) {
        // Find target window from the first tab
        const tabs = await chrome.tabs.query({});
        const targetWindowId = tabs.find(t => t.id === allTabIds[0])?.windowId;
        const validTabIds = allTabIds.filter(id => {
          const t = tabs.find(tab => tab.id === id);
          return t && t.windowId === targetWindowId;
        });

        if (validTabIds.length > 0) {
          await chrome.tabs.group({ tabIds: validTabIds, groupId });
          setSelectedTabIds([]);
          setSelectedGroupIds([]);
          updateTabs();
        }
      }
    } catch (error) {
      console.error('Failed to add selected items to group:', error);
    }
  };

  const handleCreateBulkGroup = async ({ name, color }) => {
    if (selectedTabIds.length === 0 && selectedGroupIds.length === 0) return;
    try {
      const tabsInSelectedGroups = [];
      for (const sgid of selectedGroupIds) {
        const tabs = await chrome.tabs.query({ groupId: sgid });
        tabsInSelectedGroups.push(...tabs.map(t => t.id));
      }
      const allTabIds = Array.from(new Set([...selectedTabIds, ...tabsInSelectedGroups]));

      if (allTabIds.length > 0) {
        const tabs = await chrome.tabs.query({});
        const targetWindowId = tabs.find(t => t.id === allTabIds[0])?.windowId;
        const validTabIds = allTabIds.filter(id => {
          const t = tabs.find(tab => tab.id === id);
          return t && t.windowId === targetWindowId;
        });

        if (validTabIds.length > 0) {
          const groupId = await chrome.tabs.group({ tabIds: validTabIds });
          await chrome.tabGroups.update(groupId, { title: name, color });
          setIsBulkGroupDialogOpen(false);
          setSelectedTabIds([]);
          setSelectedGroupIds([]);
          updateTabs();
        }
      }
    } catch (error) {
      console.error('Failed to create group for selected items:', error);
    }
  };

  const handleBulkDiscard = async () => {
    if (selectedTabIds.length === 0 && selectedGroupIds.length === 0) return;
    try {
      const tabsInSelectedGroups = [];
      for (const sgid of selectedGroupIds) {
        const tabs = await chrome.tabs.query({ groupId: sgid });
        tabsInSelectedGroups.push(...tabs.map(t => t.id));
      }
      const allTabIds = Array.from(new Set([...selectedTabIds, ...tabsInSelectedGroups]));

      if (allTabIds.length > 0) {
        // 現在アクティブなタブ ID を検索。アクティブなタブはスリープさせられない。
        const activeTabs = await chrome.tabs.query({ active: true });
        const activeTabIds = activeTabs.map(t => t.id);

        const discardableTabIds = allTabIds.filter(id => !activeTabIds.includes(id));

        if (discardableTabIds.length > 0) {
          isInternalChange.current = true;
          // ウィンドウが閉じないよう、かつ確実に全てのタブを処理するため、順次実行
          const executeSequentialDiscard = async () => {
            for (const id of discardableTabIds) {
              try {
                await chrome.tabs.discard(id);
                // 各API呼び出し後にわずかなディレイを挟み、ブラウザの挙動を安定させる
                await new Promise(resolve => setTimeout(resolve, 50));
              } catch (err) {
                console.warn(`Failed to discard tab ${id}:`, err);
              }
            }
            setSelectedTabIds([]);
            setSelectedGroupIds([]);
            isInternalChange.current = false;
            updateTabs();
          };
          executeSequentialDiscard();
        }
      }
    } catch (error) {
      console.error('Failed to discard selected items:', error);
    }
  };

  const getBulkMenuItems = () => {
    const totalSelected = selectedTabIds.length + selectedGroupIds.length;
    const items = [
      {
        label: `Close ${totalSelected} Items`,
        icon: '🗑️',
        onClick: handleCloseSelectedTabs
      },
      {
        label: 'Move to New Window',
        icon: '🗔',
        onClick: handleMoveToNewWindow
      },
      {
        label: 'New Group',
        icon: '📁',
        onClick: () => setIsBulkGroupDialogOpen(true)
      },
      {
        label: `Sleep ${totalSelected} Items`,
        icon: '💤',
        onClick: handleBulkDiscard
      }
    ];

    const currentGroups = Object.values(groups);
    if (currentGroups.length > 0 && (selectedTabIds.length > 0 || selectedGroupIds.length > 0)) {
      let targetWindowId = -1;
      const targetId = selectedTabIds.length > 0 ? selectedTabIds[0] : selectedGroupIds[0];
      const isTabSearch = selectedTabIds.length > 0;

      for (const win of displayTabs) {
        const found = win.order.some(item => {
          if (isTabSearch) {
            if (item.type === 'tab' && item.id === targetId) return true;
            if (item.type === 'group' && win.groups[item.id]) {
              return win.groups[item.id].tabs.some(t => t.id === targetId);
            }
          } else {
            return item.type === 'group' && item.id === targetId;
          }
          return false;
        });

        if (found) {
          targetWindowId = win.windowId;
          break;
        }
      }

      const relevantGroups = currentGroups.filter(g => g.windowId === targetWindowId);

      if (relevantGroups.length > 0) {
        items.push({
          label: 'Add to Group',
          icon: '📂',
          submenu: relevantGroups.map(group => ({
            label: group.title || 'Untitled',
            icon: CHROME_COLORS.find(c => c.value === group.color)?.icon || '⚫',
            onClick: () => handleBulkAddToGroup(group.id)
          }))
        });
      }
    }

    return items;
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
    isInternalChange.current = true;

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
        const initialTabsToMove = selectedTabIds.includes(active.id) ? selectedTabIds : [active.id];

        // 1. 移動するタブを表示順にソート
        const allTabIdsOrdered = windowTabs.flatMap(win => {
          return win.order.flatMap(item => {
            if (item.type === 'tab') return [item.id];
            if (item.type === 'group' && win.groups[item.id]) {
              return win.groups[item.id].tabs.map(t => t.id);
            }
            return [];
          });
        });
        const tabsToMove = [...initialTabsToMove].sort((a, b) =>
          allTabIdsOrdered.indexOf(a) - allTabIdsOrdered.indexOf(b)
        );

        // 2. 移動元のウィンドウIDを特定
        let activeTabSourceWindowId = -1;
        for (const window of windowTabs) {
          if (window.tabs.find(t => t.id === active.id) ||
            Object.values(window.groups).some(g => g.tabs.find(t => t.id === active.id))) {
            activeTabSourceWindowId = window.windowId;
            break;
          }
        }

        // 3. 移動実行
        // 同一ウィンドウかつ前方向への移動の場合、インデックスがズレるが、chrome.tabs.move(array) は一括で正しく処理してくれる
        if (activeTabSourceWindowId !== targetWindowId) {
          await chrome.tabs.move(tabsToMove, { windowId: targetWindowId, index: targetIndex });
        } else {
          await chrome.tabs.move(tabsToMove, { index: targetIndex });
        }

        // 4. グループ設定の適用
        if (targetGroupId !== -1) {
          await chrome.tabs.group({ tabIds: tabsToMove, groupId: targetGroupId });
        } else {
          const currentTabs = await chrome.tabs.query({ windowId: targetWindowId });
          const tabsToUngroup = tabsToMove.filter(id => {
            const t = currentTabs.find(ct => ct.id === id);
            return t && t.groupId !== -1;
          });
          if (tabsToUngroup.length > 0) {
            await chrome.tabs.ungroup(tabsToUngroup);
          }
        }
      } else if (activeType === 'group') {
        await chrome.tabGroups.move(active.id, { windowId: targetWindowId, index: targetIndex });
      }

      // 最後に一度だけ更新
      updateTabs();
      setTimeout(() => { isInternalChange.current = false; }, 500);
    } catch (error) {
      console.error('Failed to move item:', error);
      updateTabs();
      isInternalChange.current = false;
    }
  };

  const handleDragCancel = () => {
    setActiveDragTab(null);
    setActiveDragGroup(null);
  };

  useEffect(() => {
    // 初期選択状態の取得
    const initSelection = async () => {
      try {
        const highlightedTabs = await chrome.tabs.query({ highlighted: true });
        isInternalChange.current = true;
        setSelectedTabIds(highlightedTabs.map(t => t.id));
        setTimeout(() => { isInternalChange.current = false; }, 100);
      } catch (e) {
        console.error('Failed to get initial highlights:', e);
      }
    };
    initSelection();

    const handleHighlighted = async () => {
      if (isInternalChange.current || isLassoingRef.current) return;
      try {
        const tabs = await chrome.tabs.query({ highlighted: true });
        isInternalChange.current = true;
        setSelectedTabIds(tabs.map(t => t.id));
        setTimeout(() => { isInternalChange.current = false; }, 100);
        // タブのアクティブ状態なども更新するために updateTabs も呼ぶ
        updateTabs();
      } catch (e) {
        console.error('Failed to sync Chrome highlights to extension:', e);
      }
    };

    chrome.tabs.onCreated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onUpdated.addListener(updateTabs);
    chrome.tabs.onActivated.addListener(handleHighlighted);
    chrome.tabs.onHighlighted.addListener(handleHighlighted);
    chrome.tabGroups.onCreated.addListener(updateTabs);
    chrome.tabGroups.onUpdated.addListener(updateTabs);
    chrome.tabGroups.onRemoved.addListener(updateTabs);
    chrome.windows.onFocusChanged.addListener(updateTabs);

    // 初期表示
    updateTabs();

    // ストレージから設定を読み込む
    loadStatus();

    return () => {
      chrome.tabs.onCreated.removeListener(updateTabs);
      chrome.tabs.onRemoved.removeListener(updateTabs);
      chrome.tabs.onUpdated.removeListener(updateTabs);
      chrome.tabs.onActivated.removeListener(handleHighlighted);
      chrome.tabs.onHighlighted.removeListener(handleHighlighted);
      chrome.windows.onFocusChanged.removeListener(updateTabs);
      chrome.tabGroups.onCreated.removeListener(updateTabs);
      chrome.tabGroups.onUpdated.removeListener(updateTabs);
      chrome.tabGroups.onRemoved.removeListener(updateTabs);
    };
  }, []);

  useEffect(() => {
    if (searchText) {
      applySearch(windowTabs, searchText, filterMode);
    }
  }, [windowTabs]);

  // Extension -> Chrome sync
  useEffect(() => {
    if (isInternalChange.current || isLassoing) return;

    const syncToChrome = async () => {
      try {
        const tabs = await chrome.tabs.query({});
        const windows = await chrome.windows.getAll();

        // 選択されたタブをウィンドウごとにグループ化
        const windowGroups = selectedTabIds.reduce((acc, id) => {
          const tab = tabs.find(t => t.id === id);
          if (tab) {
            if (!acc[tab.windowId]) acc[tab.windowId] = [];
            acc[tab.windowId].push(tab);
          }
          return acc;
        }, {});

        isInternalChange.current = true;

        // 全てのウィンドウに対してループを回す（選択されていないウィンドウも対象）
        for (const win of windows) {
          const winId = win.id;
          const selectedTabsInWin = windowGroups[winId] || [];

          // 当該ウィンドウで現在アクティブなタブを特定
          const activeTabInWin = tabs.find(t => t.windowId === winId && t.active);

          let indices = selectedTabsInWin.map(t => t.index);

          // アクティブなタブをハイライトに含める（ポップアップ保護のため）
          if (activeTabInWin) {
            if (!indices.includes(activeTabInWin.index)) {
              indices.push(activeTabInWin.index);
            }
            // アクティブなタブを優先してフォーカス維持
            const activeIndex = activeTabInWin.index;
            indices = [activeIndex, ...indices.filter(i => i !== activeIndex)];
          }

          // indices が空になることはない（activeTabInWin が必ずあるため）
          await chrome.tabs.highlight({
            windowId: winId,
            tabs: indices
          });
        }

        setTimeout(() => { isInternalChange.current = false; }, 500);
      } catch (e) {
        console.error('Failed to sync selection to Chrome:', e);
        isInternalChange.current = false;
      }
    };

    syncToChrome();
  }, [selectedTabIds, isLassoing]);

  return (
    <div
      className={`${styles.popupMain} ${isSidePanelMode ? styles.sidePanelMode : ''}`}
      onMouseDown={handleMouseDown}
    >
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
        collisionDetection={closestCorners}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
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
                selectedTabIds={selectedTabIds}
                selectedGroupIds={selectedGroupIds}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div className={styles.empty}>
              <p>No tabs found.</p>
            </div>
          )}
          <Footer
            windowCount={displayTabs.length}
            allTabCount={allTabCount}
            selectedCount={selectedTabIds.length + selectedGroupIds.length}
            onMenuClick={handleFooterMenuClick}
          />
        </div>

        {footerMenuOpen && (
          <DropdownMenu
            items={getBulkMenuItems()}
            anchorRef={{ current: footerMenuAnchorRef.current }}
            onClose={() => setFooterMenuOpen(false)}
          />
        )}

        {isBulkGroupDialogOpen && (
          <GroupDialog
            onCancel={() => setIsBulkGroupDialogOpen(false)}
            onConfirm={handleCreateBulkGroup}
          />
        )}
        {selectionBox && (
          <div
            className={styles.selectionBox}
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX) + 'px',
              top: Math.min(selectionBox.startY, selectionBox.currentY) + 'px',
              width: Math.abs(selectionBox.startX - selectionBox.currentX) + 'px',
              height: Math.abs(selectionBox.startY - selectionBox.currentY) + 'px'
            }}
          />
        )}
        <DragOverlay dropAnimation={null}>
          {activeDragTab ? (
            <div className={styles.dragOverlay}>
              <div className={styles.tabItemStub}>
                {activeDragTab.favIconUrl && (
                  <img src={activeDragTab.favIconUrl} className={styles.faviconStub} alt="" />
                )}
                <span className={styles.titleStub}>{activeDragTab.title}</span>
              </div>
              {selectedTabIds.length > 1 && selectedTabIds.includes(activeDragTab.id) && (
                <div className={styles.dragBadge}>
                  {selectedTabIds.length}
                </div>
              )}
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