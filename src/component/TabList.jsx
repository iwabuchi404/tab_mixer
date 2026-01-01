// TabList.jsx
import React, { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import styles from './TabList.module.css';
import TabItem from './TabItem';
import SortableTabItem from './SortableTabItem';
import TabGroup from './TabGroup';
import SortableTabGroup from './SortableTabGroup';

const TabList = ({ windowId, order, tabList, groups, listTitle, currentWindow, onTabReorder, existingGroups = [] }) => {
  const [isOpen, setIsOpen] = useState(true);

  // ソート可能なアイテムのIDリストを作成
  const sortableItems = order ? order.map(item => item.id) : [];

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
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          {order && order.map(item => {
            if (item.type === 'group' && groups[item.id]) {
              const group = groups[item.id];
              return (
                <SortableTabGroup
                  key={item.id}
                  groupInfo={group}
                  onGroupUpdate={onTabReorder}
                  windowId={windowId}
                >
                  <SortableContext
                    items={group.tabs.map(tab => tab.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {group.tabs && group.tabs.map(tab => (
                      <SortableTabItem
                        key={tab.id}
                        tabData={tab}
                        windowId={windowId}
                        existingGroups={existingGroups}
                        onTabReorder={onTabReorder}
                      />
                    ))}
                  </SortableContext>
                </SortableTabGroup>
              );
            } else if (item.type === 'tab') {
              const tab = tabList.find(t => t.id === item.id);
              return tab && (
                <SortableTabItem
                  key={tab.id}
                  tabData={tab}
                  windowId={windowId}
                  existingGroups={existingGroups}
                  onTabReorder={onTabReorder}
                />
              );
            }
            return null;
          })}
        </SortableContext>
      </div>
    </div>
  );
};

export default TabList;