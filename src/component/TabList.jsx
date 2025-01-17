// TabList.jsx
import React, { useState, useEffect } from 'react';  // Vue.jsでいう { ref, onMounted } from 'vue'
import styles from './TabList.module.css';
import TabItem from './TabItem';
import TabGroup from './TabGroup';
const TabList = ({ windowId, order, tabList, groups, listTitle, currentWindow }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.container}>
      <h2 className={`${styles.header} ${currentWindow ? styles.currentWindow : ''} ${isOpen ? styles.open : ''}`}> {listTitle}
        <span className={styles.count}>Tabs: {tabList.length}</span>
        <button className={`${styles.windowToggleIcon} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen(!isOpen)}>▼</button>
      </h2>
      <div className={`${styles.windowTabs} ${isOpen ? styles.open : ''}`}>
        {order.map(item => {
          if (item.type === 'group') {
            const group = groups[item.id];
            return (
              <TabGroup key={item.id} groupInfo={group}>
                {group.tabs.map(tab => (
                  <TabItem key={tab.id} tabDate={tab} />
                ))}
              </TabGroup>
            );
          } else {
            const tab = tabList.find(t => t.id === item.id);
            return tab && <TabItem key={tab.id} tabDate={tab} windowId={windowId} className={styles.tabItem} />;
          }
        })}
      </div>
    </div>
  );
};

export default TabList;