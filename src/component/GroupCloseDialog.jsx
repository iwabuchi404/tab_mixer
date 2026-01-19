// GroupCloseDialog.jsx
import React from 'react';
import styles from './GroupCloseDialog.module.css';

const GroupCloseDialog = ({ groupTitle, onUngroup, onCloseTabs, onCancel }) => {
    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Close Group?</h2>
                <p className={styles.description}>
                    You are about to close the group "<strong>{groupTitle || 'Tab Group'}</strong>".
                    What would you like to do with the tabs inside?
                </p>

                <div className={styles.choiceList}>
                    <button className={styles.choiceButton} onClick={onUngroup}>
                        <div className={styles.choiceIcon}>🔓</div>
                        <div className={styles.choiceContent}>
                            <div className={styles.choiceTitle}>Ungroup Only</div>
                            <div className={styles.choiceText}>Keep all tabs open</div>
                        </div>
                    </button>

                    <button className={`${styles.choiceButton} ${styles.danger}`} onClick={onCloseTabs}>
                        <div className={styles.choiceIcon}>🗑️</div>
                        <div className={styles.choiceContent}>
                            <div className={styles.choiceTitle}>Close All Tabs</div>
                            <div className={styles.choiceText}>Remove all tabs in this group</div>
                        </div>
                    </button>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupCloseDialog;
