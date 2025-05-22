// TabList.jsx
import React, { useState, useEffect } from 'react';  // Vue.jsでいう { ref, onMounted } from 'vue'
import styles from './TabList.module.css';
import TabItem from './TabItem';
import TabGroup from './TabGroup';
// Removed DndContext and related imports from @dnd-kit/core as it's now in Popup.jsx
import {
  SortableContext,
  verticalListSortingStrategy,
  // sortableKeyboardCoordinates might still be needed if we re-introduce specific sensor setups per list,
  // but for now, Popup.jsx handles sensors globally.
} from '@dnd-kit/sortable';

// handleDragEnd prop is removed as DndContext is now in Popup.jsx
const TabList = ({ windowId, order, tabList, groups, listTitle, currentWindow }) => {
  const [isOpen, setIsOpen] = useState(true);

  // orderedItemIds are the string versions of tab IDs and group IDs for SortableContext
  // This includes both ungrouped tabs and group containers.
  const orderedItemIds = order.map(item => item.id.toString());

  return (
    <div className={styles.container}>
      <h2 className={`${styles.header} ${currentWindow ? styles.currentWindow : ''} ${isOpen ? styles.open : ''}`}> {listTitle}
        <span className={styles.count}>Tabs: {tabList.length}</span> {/* This count might be for ungrouped tabs only, or total depending on `tabList` prop */}
        <button className={`${styles.windowToggleIcon} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen(!isOpen)}>▼</button>
      </h2>
      {/* DndContext was removed from here. SortableContext directly wraps the list of sortable items. */}
      <SortableContext items={orderedItemIds} strategy={verticalListSortingStrategy}>
        <div className={`${styles.windowTabs} ${isOpen ? styles.open : ''}`}>
          {order.map(item => {
            // item in 'order' can be { type: 'group', id: groupId } or { type: 'tab', id: tabId }
            if (item.type === 'group') {
              const group = groups[item.id];
              // Ensure group is not undefined and has a tabs property
              if (!group || !group.tabs) {
                console.warn(`TabList: Group with id ${item.id} not found in groups prop or has no tabs array.`);
                return null;
              }
              return (
                // TabGroup now also needs to ensure its TabItems get windowId for their useSortable data
                // The `groupInfo` (group object) itself should contain tabs that already have their `windowId` property.
                // `windowId` prop is passed to TabGroup primarily for its own potential useSortable data if groups themselves become sortable.
                <TabGroup key={group.id} groupInfo={group} windowId={windowId}>
                  {/* Children of TabGroup are TabItems. They are created from group.tabs */}
                  {/* TabItem inside TabGroup will get its windowId from tab.windowId (part of tabDate) */}
                </TabGroup>
              );
            } else { // item.type === 'tab'
              // This is an ungrouped tab. `tabList` prop should be the list of ungrouped tabs for this window.
              const tab = tabList.find(t => t.id === item.id);
              if (!tab) {
                console.warn(`TabList: Ungrouped tab with id ${item.id} not found in tabList prop.`);
                return null;
              }
              // Ensure windowId is passed to TabItem for its useSortable data
              return <TabItem key={tab.id} tabDate={tab} windowId={windowId} className={styles.tabItem} />;
            }
          })}
        </div>
      </SortableContext>
    </div>
  );
};

export default TabList;