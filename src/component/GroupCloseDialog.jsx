// GroupCloseDialog.jsx
import React from 'react';
import styles from './GroupCloseDialog.module.css';

const GroupCloseDialog = ({ groupTitle, onUngroup, onCloseTabs, onCancel }) => {
    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>グループを閉じますか？</h2>
                <p className={styles.description}>
                    グループ「<strong>{groupTitle || 'Tab Group'}</strong>」を閉じようとしています。
                    中のタブをどうしますか？
                </p>

                <div className={styles.choiceList}>
                    <button className={styles.choiceButton} onClick={onUngroup}>
                        <div className={styles.choiceIcon}>🔓</div>
                        <div className={styles.choiceContent}>
                            <div className={styles.choiceTitle}>グループを解除</div>
                            <div className={styles.choiceText}>タブは残ります</div>
                        </div>
                    </button>

                    <button className={`${styles.choiceButton} ${styles.danger}`} onClick={onCloseTabs}>
                        <div className={styles.choiceIcon}>🗑️</div>
                        <div className={styles.choiceContent}>
                            <div className={styles.choiceTitle}>タブもすべて閉じる</div>
                            <div className={styles.choiceText}>開いているタブをすべて削除します</div>
                        </div>
                    </button>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupCloseDialog;
