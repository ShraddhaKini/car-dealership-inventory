const config = require('./config');
const { createDatabase } = require('./database');
const UserRepository = require('./repositories/userRepository');
const AuthService = require('./services/authService');

const email = process.env.ADMIN_EMAIL || 'admin@dealership.com';
const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

const db = createDatabase(config.databasePath);
const authService = new AuthService(new UserRepository(db), { jwtSecret: config.jwtSecret });

authService
  .register({ email, password }, 'admin')
  .then((admin) => console.log(`Admin created: ${admin.email}`))
  .catch((error) => console.log(`Admin not created: ${error.message}`))
  .finally(() => db.close());
