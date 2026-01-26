/**
 * Queue storage utilities for localStorage
 * Handles queue entry storage with date-based expiry
 */

const STORAGE_KEY = 'queueEntry';
const DATE_KEY = 'queueDate';

export const saveQueueEntry = (queueEntry) => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queueEntry));
  localStorage.setItem(DATE_KEY, today);
};

export const getQueueEntry = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const storedDate = localStorage.getItem(DATE_KEY);
  const today = new Date().toISOString().split('T')[0];

  // If no entry or date mismatch, return null
  if (!stored || storedDate !== today) {
    if (storedDate !== today) {
      // Clear expired entry
      clearQueueEntry();
    }
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    clearQueueEntry();
    return null;
  }
};

export const clearQueueEntry = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DATE_KEY);
};

export const hasValidQueueEntry = () => {
  return getQueueEntry() !== null;
};
