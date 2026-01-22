import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TabGroup from './TabGroup';
import DragHandle from './DragHandle';
import styles from './SortableTabGroup.module.css';

const SortableTabGroup = ({ groupInfo, children, onGroupUpdate, windowId, isSelected, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(true);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: groupInfo.id,
        data: {
            type: 'group',
            groupInfo,
            windowId
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.sortableContainer} ${isDragging ? styles.dragging : ''}`}
        >
            <div className={`${styles.headerRow} ${isSelected ? styles.selected : ''}`}>
                <DragHandle
                    attributes={attributes}
                    listeners={listeners}
                    isSelected={isSelected}
                    className={styles.groupDragHandle}
                />

                <div className={styles.groupContent}>
                    <TabGroup
                        groupInfo={groupInfo}
                        onGroupUpdate={onGroupUpdate}
                        isSelected={isSelected}
                        onSelect={onSelect}
                        isOpen={isOpen}
                        onToggle={setIsOpen}
                        headerOnly={true}
                    />
                </div>
            </div>

            <div className={`${styles.groupTabsContainer} ${isOpen ? styles.open : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default React.memo(SortableTabGroup);
