const express = require('express');
const cors = require('cors');
const UserRepository = require('./repositories/userRepository');
const VehicleRepository = require('./repositories/vehicleRepository');
const AuthService = require('./services/authService');
const VehicleService = require('./services/vehicleService');
const createAuthMiddleware = require('./middleware/authMiddleware');
const createAuthRoutes = require('./routes/authRoutes');
const createVehicleRoutes = require('./routes/vehicleRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

/**
 * Composition root: wires repositories, services, middleware and routes together.
 * @param {{db: import('better-sqlite3').Database, jwtSecret: string, jwtExpiresIn?: string, bcryptRounds?: number}} options
 */
function createApp({ db, jwtSecret, jwtExpiresIn, bcryptRounds }) {
  const authService = new AuthService(new UserRepository(db), { jwtSecret, jwtExpiresIn, bcryptRounds });
  const vehicleService = new VehicleService(new VehicleRepository(db));
  const authMiddleware = createAuthMiddleware(authService);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', createAuthRoutes(authService));
  app.use('/api/vehicles', createVehicleRoutes(vehicleService, authMiddleware));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
