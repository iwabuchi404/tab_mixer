// TabList.jsx
import React, { useState, useEffect } from 'react';
import styles from './header.module.css';
import SearchBox from './searchBox';
const Header = ({ searchText, setSearchText, onSearch, filterMode, onFilterModeChange }) => {

  return (
    <div className={styles.header}>
      <div className={styles.header__inner}>
        <h1 className={styles.title}>
          <img src='/icons/icon.svg' className={styles.icon} />Tab Mixer</h1>
        <SearchBox
          searchText={searchText}
          onChange={setSearchText}
          onSearch={onSearch}
          filterMode={filterMode}
          onFilterModeChange={onFilterModeChange}
        />
      </div>
    </div>
  );
};

export default Header;