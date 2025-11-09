// Currency conversion utilities

// Approximate USD to INR exchange rate (you can update this with real-time API later)
const USD_TO_INR = 83.50;

export const convertPrice = (usdPrice, currency) => {
  if (currency === 'INR') {
    return usdPrice * USD_TO_INR;
  }
  return usdPrice;
};

export const formatCurrency = (amount, currency) => {
  const symbol = currency === 'INR' ? '₹' : '$';
  const convertedAmount = convertPrice(amount, currency);

  // Format with appropriate decimal places
  if (convertedAmount >= 1000) {
    return `${symbol}${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (convertedAmount >= 1) {
    return `${symbol}${convertedAmount.toFixed(2)}`;
  } else {
    return `${symbol}${convertedAmount.toFixed(8)}`;
  }
};

export const getCurrencySymbol = (currency) => {
  return currency === 'INR' ? '₹' : '$';
};

export const getCurrencyName = (currency) => {
  return currency === 'INR' ? 'Indian Rupee' : 'US Dollar';
};

export default {
  convertPrice,
  formatCurrency,
  getCurrencySymbol,
  getCurrencyName,
  USD_TO_INR
};
