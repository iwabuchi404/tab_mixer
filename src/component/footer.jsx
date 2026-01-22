// Footer.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './footer.module.css';

const Footer = ({ windowCount, allTabCount, selectedCount, onMenuClick }) => {
  const menuButtonRef = useRef(null);

  const handleMenuClick = (e) => {
    if (onMenuClick) {
      onMenuClick(menuButtonRef, e);
    }
  };

  return (
    <div className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.stats}>
          <p className={styles.counter}>
            <span>{windowCount}</span> Windows
            <span>{allTabCount}</span> Tabs
          </p>
        </div>

        {selectedCount > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.selectionGroup}>
              <span className={styles.selectedCount}>
                <span>{selectedCount}</span> Selected
              </span>
              <button
                ref={menuButtonRef}
                className={styles.menuButton}
                onClick={handleMenuClick}
                aria-label="Bulk actions"
              >
                Actions
                <span className={styles.arrow}>▼</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;