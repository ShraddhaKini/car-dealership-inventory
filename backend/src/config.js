require('dotenv').config();
const path = require('path');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'dealership.db'),
};
