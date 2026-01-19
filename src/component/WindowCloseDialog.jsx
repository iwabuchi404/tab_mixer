import React from 'react';
import styles from './WindowCloseDialog.module.css';

const WindowCloseDialog = ({ onConfirm, onCancel }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Close Window</h2>
                </div>
                <div className={styles.content}>
                    <p className={styles.message}>
                        Do you want to close all tabs in this window?
                    </p>
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Cancel
                    </button>
                    <button className={styles.confirmButton} onClick={onConfirm}>
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WindowCloseDialog;
