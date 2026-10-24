const request = require('supertest');
const { createTestContext, loginAs, bearer, sampleVehicle } = require('./helpers');

describe('Inventory API', () => {
  let context;
  let userToken;
  let adminToken;

  const addVehicle = async (overrides) => {
    const response = await request(context.app)
      .post('/api/vehicles')
      .set(bearer(userToken))
      .send(sampleVehicle(overrides));
    return response.body;
  };

  const purchase = (id, body = {}, token = userToken) =>
    request(context.app).post(`/api/vehicles/${id}/purchase`).set(bearer(token)).send(body);

  const restock = (id, body, token = adminToken) =>
    request(context.app).post(`/api/vehicles/${id}/restock`).set(bearer(token)).send(body);

  beforeEach(async () => {
    context = createTestContext();
    userToken = await loginAs(context, { email: 'user@example.com' });
    adminToken = await loginAs(context, { email: 'admin@example.com', role: 'admin' });
  });

  afterEach(() => {
    context.close();
  });

  describe('POST /api/vehicles/:id/purchase', () => {
    it('decreases the quantity by one by default', async () => {
      const vehicle = await addVehicle({ quantity: 3 });

      const response = await purchase(vehicle.id);

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(2);
    });

    it('decreases the quantity by the requested amount', async () => {
      const vehicle = await addVehicle({ quantity: 5 });

      const response = await purchase(vehicle.id, { quantity: 3 });

      expect(response.body.quantity).toBe(2);
    });

    it('allows buying the last unit', async () => {
      const vehicle = await addVehicle({ quantity: 1 });

      const response = await purchase(vehicle.id);

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(0);
    });

    it('returns 409 when the vehicle is out of stock', async () => {
      const vehicle = await addVehicle({ quantity: 0 });

      const response = await purchase(vehicle.id);

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/out of stock/i);
    });

    it('returns 409 and leaves stock untouched when asking for more than available', async () => {
      const vehicle = await addVehicle({ quantity: 2 });

      const response = await purchase(vehicle.id, { quantity: 3 });
      const list = await request(context.app).get('/api/vehicles').set(bearer(userToken));

      expect(response.status).toBe(409);
      expect(list.body[0].quantity).toBe(2);
    });

    it.each([[0], [-1], [1.5], ['2']])('rejects quantity %p with 400', async (quantity) => {
      const vehicle = await addVehicle();

      const response = await purchase(vehicle.id, { quantity });

      expect(response.status).toBe(400);
    });

    it('returns 404 for an unknown vehicle', async () => {
      const response = await purchase(999);

      expect(response.status).toBe(404);
    });

    it('returns 400 for an invalid id', async () => {
      const response = await purchase('abc');

      expect(response.status).toBe(400);
    });

    it('requires authentication', async () => {
      const response = await request(context.app).post('/api/vehicles/1/purchase');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/vehicles/:id/restock', () => {
    it('lets an admin increase the quantity', async () => {
      const vehicle = await addVehicle({ quantity: 1 });

      const response = await restock(vehicle.id, { quantity: 10 });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(11);
    });

    it('forbids a regular user with 403', async () => {
      const vehicle = await addVehicle();

      const response = await restock(vehicle.id, { quantity: 5 }, userToken);

      expect(response.status).toBe(403);
    });

    it.each([[undefined], [0], [-4], [2.5]])('rejects quantity %p with 400', async (quantity) => {
      const vehicle = await addVehicle();

      const response = await restock(vehicle.id, { quantity });

      expect(response.status).toBe(400);
    });

    it('returns 404 for an unknown vehicle', async () => {
      const response = await restock(999, { quantity: 5 });

      expect(response.status).toBe(404);
    });

    it('requires authentication', async () => {
      const response = await request(context.app).post('/api/vehicles/1/restock').send({ quantity: 1 });

      expect(response.status).toBe(401);
    });
  });
});
