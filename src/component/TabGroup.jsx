// TabGroup .jsx
import React, { useState, useEffect } from 'react';
import styles from './TabGroup.module.css';
const TabGroup = ({ groupInfo, children, className = '', defaultOpenState = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpenState);

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
        {children}
      </div>
    </div >
  );
};

export default TabGroup;