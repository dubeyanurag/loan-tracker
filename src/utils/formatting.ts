// src/utils/formatting.ts

/**
 * Formats a number as currency according to the specified currency code.
 * Defaults to 'en-IN' locale for India-specific formatting if no specific locale needed for currency.
 * 
 * @param amount The number to format.
 * @param currencyCode The ISO 4217 currency code (e.g., 'INR', 'USD').
 * @returns A string representing the formatted currency.
 */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  if (isNaN(amount)) {
    return 'N/A'; 
  }
  
  let locale = 'en-IN'; // Default locale, good for INR

  // You can add more locale mappings if specific formatting is needed for other currencies
  // For example, for USD, 'en-US' might be preferred by some.
  // if (currencyCode === 'USD') locale = 'en-US';
  // if (currencyCode === 'EUR') locale = 'de-DE'; // Example for Euro

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2, // Standard for most currencies
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error(`Error formatting currency for code ${currencyCode}:`, error);
    // Fallback for unsupported currency codes by Intl.NumberFormat
    return `${currencyCode} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Formats a date string (YYYY-MM-DD) to a more readable format.
 * Example: "15 Jan 2023"
 * 
 * @param dateString The date string in YYYY-MM-DD format.
 * @returns A formatted date string or the original string if invalid.
 */
export const formatDateReadable = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        // Add time zone offset to treat date as local, preventing off-by-one day issues
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        return localDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch (error) {
        return dateString; // Fallback
    }
};
