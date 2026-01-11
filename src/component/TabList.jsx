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
import ExpandIcon from './ExpandIcon';
import CloseIcon from './CloseIcon';
import WindowCloseDialog from './WindowCloseDialog';

const TabList = ({ windowId, order, tabList, groups, listTitle, currentWindow, onTabReorder, existingGroups = [] }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleCloseWindow = async () => {
    try {
      await chrome.windows.remove(windowId);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error removing window:', error);
    }
  };

  // ソート可能なアイテムのIDリストを作成
  const sortableItems = order ? order.map(item => item.id) : [];

  return (
    <div className={styles.container}>
      <h2 className={`${styles.header} ${currentWindow ? styles.currentWindow : ''} ${isOpen ? styles.open : ''}`}>
        <div className={styles.headerLeft}>
          {listTitle}
          <ExpandIcon
            isOpen={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            ariaLabel={isOpen ? "Collapse window" : "Expand window"}
            className={styles.windowToggleIcon}
          />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>Tabs: {(tabList ? tabList.length : 0) + Object.values(groups || {}).reduce((acc, g) => acc + (g.tabs ? g.tabs.length : 0), 0)}</span>
          <CloseIcon
            onClick={() => setConfirmDialogOpen(true)}
            className={styles.windowCloseButton}
            ariaLabel="Close window"
          />
        </div>
      </h2>

      {confirmDialogOpen && (
        <WindowCloseDialog
          onConfirm={handleCloseWindow}
          onCancel={() => setConfirmDialogOpen(false)}
        />
      )}

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