import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TabItem from './TabItem';
import styles from './SortableTabItem.module.css';

const SortableTabItem = ({ tabData, windowId, existingGroups, onTabReorder }) => {
  // タブデータの安全性チェック
  if (!tabData || !tabData.id) {
    console.warn('Invalid tab data in SortableTabItem:', tabData);
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tabData.id,
    data: {
      type: 'tab',
      tabData,
      windowId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.sortableContainer} ${isDragging ? styles.dragging : ''} ${tabData.active ? styles.activeTab : ''}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <svg
          width="8"
          height="16"
          viewBox="0 0 8 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.dragIcon}
        >
          <circle cx="2" cy="3" r="1" fill="currentColor" />
          <circle cx="6" cy="3" r="1" fill="currentColor" />
          <circle cx="2" cy="8" r="1" fill="currentColor" />
          <circle cx="6" cy="8" r="1" fill="currentColor" />
          <circle cx="2" cy="13" r="1" fill="currentColor" />
          <circle cx="6" cy="13" r="1" fill="currentColor" />
        </svg>
      </div>

      <TabItem
        tabData={tabData}
        windowId={windowId}
        isDragging={isDragging}
        existingGroups={existingGroups}
        onTabReorder={onTabReorder}
      />
    </div>
  );
};

export default SortableTabItem;
