// GroupDialog.jsx
import React, { useState } from 'react';
import styles from './GroupDialog.module.css';

const CHROME_COLORS = [
    { value: 'grey', name: 'Grey', icon: '⚫', hex: '#5f6368' },
    { value: 'blue', name: 'Blue', icon: '🔵', hex: '#1a73e8' },
    { value: 'red', name: 'Red', icon: '🔴', hex: '#d93025' },
    { value: 'yellow', name: 'Yellow', icon: '🟡', hex: '#f9ab00' },
    { value: 'green', name: 'Green', icon: '🟢', hex: '#188038' },
    { value: 'pink', name: 'Pink', icon: '🩷', hex: '#d01884' },
    { value: 'purple', name: 'Purple', icon: '🟣', hex: '#9334e6' },
    { value: 'cyan', name: 'Cyan', icon: '🔵', hex: '#007b83' }
];

const GroupDialog = ({
    mode = 'create',
    initialName = '',
    initialColor = 'blue',
    onConfirm,
    onCancel
}) => {
    const [name, setName] = useState(initialName);
    const [color, setColor] = useState(initialColor);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ name, color });
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
                <h2 className={styles.title}>
                    {mode === 'create' ? 'New Group' : 'Edit Group'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Group Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter group name"
                            autoFocus
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Color</label>
                        <div className={styles.colorGrid}>
                            {CHROME_COLORS.map((colorOption) => (
                                <button
                                    key={colorOption.value}
                                    type="button"
                                    className={`${styles.colorButton} ${color === colorOption.value ? styles.selected : ''
                                        }`}
                                    onClick={() => setColor(colorOption.value)}
                                    title={colorOption.name}
                                    style={{ '--color': colorOption.hex }}
                                >
                                    <span className={styles.colorCircle} />
                                </button>
                            ))}
                        </div>
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
                            {mode === 'create' ? 'Create' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupDialog;
export { CHROME_COLORS };
