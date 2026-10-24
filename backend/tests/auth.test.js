const request = require('supertest');
const { createTestContext, loginAs, bearer, PASSWORD } = require('./helpers');

describe('Auth API', () => {
  let context;

  beforeEach(() => {
    context = createTestContext();
  });

  afterEach(() => {
    context.close();
  });

  describe('POST /api/auth/register', () => {
    it('creates a user and never returns the password', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({ email: 'Jane@Example.com', password: PASSWORD });

      expect(response.status).toBe(201);
      expect(response.body.user).toEqual({ id: expect.any(Number), email: 'jane@example.com', role: 'user' });
      expect(JSON.stringify(response.body)).not.toMatch(/password/i);
    });

    it('ignores a role supplied by the client', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({ email: 'sneaky@example.com', password: PASSWORD, role: 'admin' });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('user');
    });

    it('rejects a duplicate email with 409', async () => {
      const payload = { email: 'dup@example.com', password: PASSWORD };
      await request(context.app).post('/api/auth/register').send(payload);

      const response = await request(context.app).post('/api/auth/register').send(payload);

      expect(response.status).toBe(409);
    });

    it.each([
      ['an invalid email', { email: 'not-an-email', password: PASSWORD }],
      ['a missing email', { password: PASSWORD }],
      ['a short password', { email: 'a@example.com', password: 'short' }],
      ['a missing password', { email: 'a@example.com' }],
    ])('rejects %s with 400', async (_label, payload) => {
      const response = await request(context.app).post('/api/auth/register').send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    it('rejects a request without a body with 400', async () => {
      const response = await request(context.app).post('/api/auth/register');

      expect(response.status).toBe(400);
    });

    it('rejects malformed JSON with 400', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"email": ');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Malformed JSON body');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(context.app)
        .post('/api/auth/register')
        .send({ email: 'login@example.com', password: PASSWORD });
    });

    it('returns a token and the public user for valid credentials', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user).toMatchObject({ email: 'login@example.com', role: 'user' });
    });

    it('rejects a wrong password with 401', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'WrongPassword1' });

      expect(response.status).toBe(401);
    });

    it('rejects an unknown email with 401', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD });

      expect(response.status).toBe(401);
    });

    it('rejects a missing password with 400', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('token protection', () => {
    it('rejects requests without a token', async () => {
      const response = await request(context.app).get('/api/vehicles');

      expect(response.status).toBe(401);
    });

    it('rejects requests with an invalid token', async () => {
      const response = await request(context.app).get('/api/vehicles').set(bearer('garbage'));

      expect(response.status).toBe(401);
    });

    it('accepts requests with a valid token', async () => {
      const token = await loginAs(context, { email: 'ok@example.com' });

      const response = await request(context.app).get('/api/vehicles').set(bearer(token));

      expect(response.status).toBe(200);
    });
  });

  it('returns 404 JSON for unknown routes', async () => {
    const response = await request(context.app).get('/api/unknown');

    expect(response.status).toBe(404);
  });
});
