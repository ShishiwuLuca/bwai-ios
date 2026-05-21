import Decimal from 'decimal.js';

/** useCryptoPrecision */
export const useCryptoPrecision = () => {
  const precisionMap: Map<string, number> = new Map([
    ['BTC', 2],
    ['ETH', 3],
    ['BNB', 3],
    ['SOL', 4],
    ['TON', 5],
    ['DOGE', 6],
    ['SHIB', 8]
  ]);

  const formatCryptoPrice = (symbol: string, price: string): string => {
    const precision = precisionMap.get(symbol.replace('USDT', ''));
    if (!precision) return price;

    const truncatedPrice = new Decimal(price).toDecimalPlaces(precision, Decimal.ROUND_DOWN);

    // Add thousand separators
    const formattedPrice = truncatedPrice.toNumber().toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    return formattedPrice;
  };

  return {
    formatCryptoPrice,
    precisionMap
  };
};
