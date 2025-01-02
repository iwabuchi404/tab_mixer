// TabList.jsx
import React, { useState, useEffect } from 'react';
import styles from './footer.module.css';

const Footer = ({ windowCount, allTabCount }) => {
  return (
    <div className={styles.footer}>
      {<p className={styles.counter}>
        TotalWindow: <span>{windowCount}</span> TotalTabs: <span>{allTabCount}</span></p>}
    </div>
  );
};

export default Footer;