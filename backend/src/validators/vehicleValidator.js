const { ValidationError } = require('../errors');

const MAX_TEXT_LENGTH = 100;

const validateText = (field) => (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} must be a non-empty string`);
  }
  if (value.trim().length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`${field} must be at most ${MAX_TEXT_LENGTH} characters`);
  }
  return value.trim();
};

const validatePrice = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new ValidationError('price must be a number greater than or equal to 0');
  }
  if (value > 10000000) {
    throw new ValidationError('price must not exceed 10000000');
  }
  return value;
};

const validateQuantity = (value) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new ValidationError('quantity must be a whole number greater than or equal to 0');
  }
  return value;
};

const FIELD_VALIDATORS = {
  make: validateText('make'),
  model: validateText('model'),
  category: validateText('category'),
  price: validatePrice,
  quantity: validateQuantity,
};

/**
 * Validates a vehicle payload.
 * With partial=true every field is optional but at least one must be present (used for updates).
 */
function validateVehicleInput(payload, { partial = false } = {}) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const cleaned = {};
  for (const [field, validate] of Object.entries(FIELD_VALIDATORS)) {
    if (payload[field] === undefined) {
      if (!partial) throw new ValidationError(`${field} is required`);
      continue;
    }
    cleaned[field] = validate(payload[field]);
  }

  if (partial && Object.keys(cleaned).length === 0) {
    throw new ValidationError('Provide at least one field to update');
  }
  return cleaned;
}

/** Parses a route parameter into a positive integer id. */
function parseVehicleId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError('Vehicle id must be a positive integer');
  }
  return id;
}

/** Validates a purchase/restock amount; falls back to defaultValue when omitted. */
function validateStockAmount(value, defaultValue) {
  if (value === undefined && defaultValue !== undefined) return defaultValue;
  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError('quantity must be a whole number greater than 0');
  }
  return value;
}

/** Converts raw query-string values into typed search filters. */
function parseSearchFilters(query = {}) {
  const filters = {};

  for (const field of ['make', 'model', 'category']) {
    const raw = query[field];
    if (raw === undefined) continue;
    if (typeof raw !== 'string') throw new ValidationError(`${field} must be a single text value`);
    if (raw.trim() !== '') filters[field] = raw.trim();
  }

  for (const field of ['minPrice', 'maxPrice']) {
    const raw = query[field];
    if (raw === undefined || raw === '') continue;
    const value = typeof raw === 'string' ? Number(raw) : NaN;
    if (!Number.isFinite(value) || value < 0) {
      throw new ValidationError(`${field} must be a number greater than or equal to 0`);
    }
    filters[field] = value;
  }

  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    throw new ValidationError('minPrice cannot be greater than maxPrice');
  }
  return filters;
}

module.exports = { validateVehicleInput, parseVehicleId, validateStockAmount, parseSearchFilters };
