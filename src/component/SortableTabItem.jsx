import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TabItem from './TabItem';
import DragHandle from './DragHandle';
import styles from './SortableTabItem.module.css';

const SortableTabItem = ({ tabData, windowId, existingGroups, onTabReorder, isSelected, onSelect }) => {
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
      className={`${styles.sortableContainer} ${isDragging ? styles.dragging : ''} ${tabData.active ? styles.activeTab : ''} ${isSelected ? styles.selected : ''}`}
      data-tab-id={tabData.id}
    >
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        isSelected={isSelected}
        className={`${tabData.active ? styles.activeTabHandle : ''} ${styles.baseDragHandle}`}
      />

      <TabItem
        tabData={tabData}
        windowId={windowId}
        isDragging={isDragging}
        existingGroups={existingGroups}
        onTabReorder={onTabReorder}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    </div>
  );
};

export default React.memo(SortableTabItem);
