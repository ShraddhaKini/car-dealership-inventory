const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createDatabase } = require('../src/database');
const { createApp } = require('../src/app');
const UserRepository = require('../src/repositories/userRepository');

const PASSWORD = 'Password123';

/** Builds an app on top of a real, temporary SQLite file database. */
function createTestContext() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dealership-test-'));
  const db = createDatabase(path.join(directory, 'test.db'));
  const app = createApp({ db, jwtSecret: 'test-secret', bcryptRounds: 4 });

  return {
    app,
    db,
    close() {
      db.close();
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

/** Creates a user (admins are inserted directly) and returns a login token. */
async function loginAs(context, { email, role = 'user' }) {
  if (role === 'admin') {
    new UserRepository(context.db).create({
      email,
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      role: 'admin',
    });
  } else {
    await request(context.app).post('/api/auth/register').send({ email, password: PASSWORD });
  }
  const response = await request(context.app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD });
  return response.body.token;
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

const sampleVehicle = (overrides = {}) => ({
  make: 'Toyota',
  model: 'Corolla',
  category: 'Sedan',
  price: 20000,
  quantity: 5,
  ...overrides,
});

module.exports = { PASSWORD, createTestContext, loginAs, bearer, sampleVehicle };
