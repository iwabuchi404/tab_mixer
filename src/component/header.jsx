// TabList.jsx
import React, { useState, useEffect } from 'react';
import styles from './header.module.css';
import SearchBox from './searchBox';
import IconButton from './IconButton';

const SidePanelIcon = ({ active }) => (
  // ... (same as before)
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
    {active && <path d="M7 10l3 2-3 2v-4z" fill="currentColor" stroke="none" />}
  </svg>
);

const Header = ({ searchText, setSearchText, onSearch, filterMode, onFilterModeChange, isSidePanelMode, onSidePanelModeChange }) => {

  return (
    <div className={`${styles.header} ${isSidePanelMode ? styles.sidePanelMode : ''}`}>
      <div className={styles.header__inner}>
        <h1 className={styles.title}>
          <div className={styles.titleMain}>
            <img src='/icons/60icon.png' className={styles.icon} />
            Tab Mixer
          </div>
          <IconButton
            className={styles.sidePanelToggle}
            active={isSidePanelMode}
            onClick={() => onSidePanelModeChange(!isSidePanelMode)}
            title={isSidePanelMode ? "Side Panel Mode: ON" : "Side Panel Mode: OFF"}
          >
            <SidePanelIcon active={isSidePanelMode} />
          </IconButton>
        </h1>
        <SearchBox
          searchText={searchText}
          onChange={setSearchText}
          onSearch={onSearch}
          filterMode={filterMode}
          onFilterModeChange={onFilterModeChange}
          isSidePanelMode={isSidePanelMode}
        />
      </div>
    </div>
  );
};

export default Header;