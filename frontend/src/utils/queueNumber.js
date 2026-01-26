/**
 * Utility functions for queue number formatting
 */

/**
 * Extract just the counter part from a queue number
 * Format: MMDDYY-XXXX -> returns XXXX
 * @param {string} queueNumber - Full queue number (e.g., "012526-0001")
 * @returns {string} - Just the counter part (e.g., "0001")
 */
export function getQueueCounter(queueNumber) {
  if (!queueNumber) return '';
  const parts = queueNumber.split('-');
  return parts.length > 1 ? parts[1] : queueNumber;
}

/**
 * Format queue number for display (keeps full format)
 * @param {string} queueNumber - Full queue number
 * @returns {string} - Formatted queue number
 */
export function formatQueueNumber(queueNumber) {
  return queueNumber || '';
}
