import React from 'react';
import styles from './WindowCloseDialog.module.css';

const WindowCloseDialog = ({ onConfirm, onCancel }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h2 className={styles.title}>ウィンドウを閉じる</h2>
                </div>
                <div className={styles.content}>
                    <p className={styles.message}>
                        このウィンドウのすべてのタブを閉じますか？
                    </p>
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        キャンセル
                    </button>
                    <button className={styles.confirmButton} onClick={onConfirm}>
                        ウィンドウを閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WindowCloseDialog;
