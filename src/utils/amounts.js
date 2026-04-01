const { AppError } = require('./errors');

function amountToCents(value) {
  const normalized = typeof value === 'number' ? value.toFixed(2) : String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new AppError(400, 'Amount must be a positive number with up to 2 decimal places.');
  }

  const [wholePart, fractionalPart = ''] = normalized.split('.');
  return Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));
}

function centsToAmount(value) {
  return Number((Number(value) / 100).toFixed(2));
}

module.exports = {
  amountToCents,
  centsToAmount,
};
