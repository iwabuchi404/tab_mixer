// TabList.jsx
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import styles from './TabList.module.css';
import TabItem from './TabItem';
import SortableTabItem from './SortableTabItem';
import TabGroup from './TabGroup';

const TabList = ({ windowId, order, tabList, groups, listTitle, currentWindow, onTabReorder }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px動いてからドラッグ開始（クリックとの区別）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const activeTabData = tabList.find(tab => tab.id === active.id);
    setActiveTab(activeTabData);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTab(null);

    if (!over || active.id === over.id) {
      return;
    }

    // ドラッグされたタブと移動先のタブを取得
    const activeTab = tabList.find(tab => tab.id === active.id);
    const overTab = tabList.find(tab => tab.id === over.id);

    if (activeTab && overTab) {
      try {
        // Chrome API でタブの順序を変更
        // overTab.index を使用して正しい位置に移動
        await chrome.tabs.move(active.id, { index: overTab.index });

        // 親コンポーネントに状態更新を通知
        if (onTabReorder) {
          onTabReorder();
        }
      } catch (error) {
        console.error('Failed to move tab:', error);
        // エラー時は元の状態に戻す（自動でupdateTabsが呼ばれる）
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTab(null);
  };

  // グループに属していないタブのみを取得
  const ungroupedTabs = tabList ? tabList.filter(tab => tab && tab.groupId === -1) : [];

  // orderから、ソート可能なタブのIDリストを構築
  const sortableTabIds = order
    ? order.filter(item => item.type === 'tab').map(item => item.id)
    : [];

  return (
    <div className={styles.container}>
      <h2 className={`${styles.header} ${currentWindow ? styles.currentWindow : ''} ${isOpen ? styles.open : ''}`}>
        {listTitle}
        <span className={styles.count}>Tabs: {tabList ? tabList.length : 0}</span>
        <button
          className={`${styles.windowToggleIcon} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse window" : "Expand window"}
        >
          ▼
        </button>
      </h2>

      <div className={`${styles.windowTabs} ${isOpen ? styles.open : ''}`}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortableTabIds}
            strategy={verticalListSortingStrategy}
          >
            {order && order.map(item => {
              if (item.type === 'group' && groups[item.id]) {
                const group = groups[item.id];
                return (
                  <TabGroup key={item.id} groupInfo={group}>
                    {group.tabs && group.tabs.map(tab => (
                      <TabItem key={tab.id} tabDate={tab} windowId={windowId} />
                    ))}
                  </TabGroup>
                );
              } else if (item.type === 'tab') {
                const tab = tabList.find(t => t.id === item.id);
                return tab && (
                  <SortableTabItem 
                    key={tab.id} 
                    tabData={tab} 
                    windowId={windowId}
                  />
                );
              }
              return null;
            })}
          </SortableContext>
          
          <DragOverlay>
            {activeTab ? (
              <div className={styles.dragOverlay}>
                <TabItem 
                  tabDate={activeTab} 
                  windowId={windowId}
                  isDragging={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default TabList;