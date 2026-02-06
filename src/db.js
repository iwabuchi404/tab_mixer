import Dexie from 'dexie';

export const db = new Dexie('TabManagerDB');

db.version(1).stores({
    windows: 'id, chromeWindowId, name, status',
    tabs: 'id, chromeTabId, status, windowId, groupId, lastAccessed',
    groups: 'id, chromeGroupId, status, windowId'
});

export default db;
