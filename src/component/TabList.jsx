// TabList.jsx
import React, { useState, useEffect } from 'react';  // Vue.jsでいう { ref, onMounted } from 'vue'
import styles from './TabList.module.css';
import TabItem from './TabItem';

const TabList = ({ windowId, tabList, groups, listTitle }) => {
  console.log('TabList.jsx');
  console.log(groups);
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>{listTitle} <span className={styles.count}>Tabs: {tabList.length}</span></h2>
      <div >
        {tabList.map((tab, index) => {
          if (tab.groupId !== -1) {
            if (tab.groupId !== tabList[index - 1].groupId) {
              return <React.Fragment>
                <h3 className={styles.groupTitle}
                  style={{
                    '--group-color': groups[tab.groupId].color,
                  }}>
                  {groups[tab.groupId].title || 'グループ'}
                </h3>
                <div className={styles.groupTabs}>
                  <TabItem
                    key={tab.id}
                    windowId={windowId}
                    tabDate={tab} />
                </div>
              </React.Fragment>
            }
            return <div className={styles.groupTabs}>
              <TabItem
                key={tab.id}
                windowId={windowId}
                tabDate={tab} />
            </div>
          }
          return <TabItem
            key={tab.id}
            windowId={windowId}
            tabDate={tab} />
        })}
      </div>
    </div>
  );
};

export default TabList;