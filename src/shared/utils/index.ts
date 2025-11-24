/**
 * Shared utility functions
 */

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format cents to dollar string
 */
export const formatCents = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

/**
 * Format dollars to cents
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};
