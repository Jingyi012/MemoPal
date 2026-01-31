import { EventEmitter } from 'eventemitter3';

const syncEmitter = new EventEmitter();

export const SYNC_EVENTS = {
  DATA_CHANGED: 'DATA_CHANGED',
};

export const SyncObserver = {
  // Call this in your Repositories after a successful local save
  emitDataChange: () => {
    syncEmitter.emit(SYNC_EVENTS.DATA_CHANGED);
  },

  // The Sync Provider will listen to this
  subscribe: (callback: () => void) => {
    syncEmitter.on(SYNC_EVENTS.DATA_CHANGED, callback);
    return () => syncEmitter.off(SYNC_EVENTS.DATA_CHANGED, callback);
  },
};
