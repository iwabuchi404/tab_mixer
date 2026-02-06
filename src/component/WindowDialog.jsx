// WindowDialog.jsx
import React, { useState } from 'react';
import styles from './GroupDialog.module.css'; // Reusing GroupDialog styles

const WindowDialog = ({
    initialName = '',
    onConfirm,
    onCancel
}) => {
    const [name, setName] = useState(initialName);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(name);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div
                className={styles.dialog}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <h2 className={styles.title}>Rename Window</h2>

                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Window Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter window name"
                            autoFocus
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.confirmButton}
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WindowDialog;
