// BulkCloseDialog.jsx
import React from 'react';
import styles from './BulkCloseDialog.module.css';

const BulkCloseDialog = ({ selectedCount, groupCount, onUngroup, onCloseTabs, onCancel }) => {
    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Close Selected Items?</h2>
                <p className={styles.description}>
                    You have selected <strong>{selectedCount}</strong> items
                    {groupCount > 0 ? (
                        <> (including <strong>{groupCount}</strong> groups)</>
                    ) : ''}.
                    What would you like to do?
                </p>

                <div className={styles.choiceList}>
                    {groupCount > 0 && (
                        <button className={styles.choiceButton} onClick={onUngroup}>
                            <div className={styles.choiceIcon}>🔓</div>
                            <div className={styles.choiceContent}>
                                <div className={styles.choiceTitle}>Ungroup Only</div>
                                <div className={styles.choiceText}>Keep all tabs open but remove from groups</div>
                            </div>
                        </button>
                    )}

                    <button className={`${styles.choiceButton} ${styles.danger}`} onClick={onCloseTabs}>
                        <div className={styles.choiceIcon}>🗑️</div>
                        <div className={styles.choiceContent}>
                            <div className={styles.choiceTitle}>Close All {selectedCount} Items</div>
                            <div className={styles.choiceText}>Remove all selected tabs and groups</div>
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

export default BulkCloseDialog;
