// TabGroup .jsx
import React, { useState, useEffect } from 'react';
import styles from './TabGroup.module.css';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const TabGroup = ({ groupInfo, children, className = '', defaultOpenState = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpenState);

  // Ensure groupInfo and groupInfo.tabs are defined before mapping
  const tabIdsForSortable = groupInfo && groupInfo.tabs ? groupInfo.tabs.map(tab => tab.id.toString()) : [];

  return (
    <div className={`${styles.groupContainer} ${className}`}>
      <h3 className={styles.groupTitle}
        style={{
          '--group-color': groupInfo.color,
        }}>
        <button
          className={styles.groupTitleInner}
          onClick={() => setIsOpen(!isOpen)}>
          {groupInfo.title || 'Tab Group'}
          <span className={`${styles.toggleIcon} ${isOpen ? styles.open : ''}`}>
            ▼
          </span>
        </button >
      </h3>
      <div className={`${styles.groupTabs} ${isOpen ? styles.open : ''}`}>
        <SortableContext items={tabIdsForSortable} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div >
  );
};

export default TabGroup;