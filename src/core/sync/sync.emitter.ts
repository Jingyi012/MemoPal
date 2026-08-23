import EventEmitter from 'eventemitter3';

// We use a small library like 'eventemitter3' or just a simple class
export const syncEmitter = new EventEmitter();

export const SYNC_EVENTS = {
  DATA_CHANGED: 'DATA_CHANGED',
};
