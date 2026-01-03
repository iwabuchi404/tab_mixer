import React, { useState, useEffect } from 'react';
import styles from './searchBox.module.css';

const searchBox = ({ searchText, onChange, onSearch, filterMode, onFilterModeChange, isSidePanelMode }) => {
    const textChange = (e) => {
        onChange(e.target.value);
    };

    const clearText = () => {
        onChange("");
    }
    const search = () => {
        onSearch();
    }
    return (
        <div className={`${styles.box} ${isSidePanelMode ? styles.sidePanelMode : ''}`}>
            <input type="text" className={styles.input} placeholder="Title or URL Search..." value={searchText} onChange={textChange} />
            <button className={styles.clearButton} onClick={clearText}></button>
            <button className={styles.searchButton} onClick={search}></button>
            <div className={styles.searchMode}>
                <label className={styles.switchLabel}>
                    <span className={styles.switchText}>
                        {filterMode ? 'filter' : 'highlight'}
                    </span>
                    <input
                        type="checkbox"
                        checked={filterMode}
                        onChange={(e) => onFilterModeChange(e.target.checked)}
                        className={styles.switchInput}
                    />
                    <span className={styles.switchSlider}></span>

                </label>
            </div>
        </div>
    );
};

export default searchBox;