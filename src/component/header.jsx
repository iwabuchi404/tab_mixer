// TabList.jsx
import React, { useState, useEffect } from 'react';
import styles from './header.module.css';

const Header = () => {
  return (
    <div className={styles.header}>
      <div className={styles.header__inner}>
        <h1 className={styles.title}>
          <img src='/icons/icon.svg' className={styles.icon} />Tab Mixer</h1>
      </div>
    </div>
  );
};

export default Header;