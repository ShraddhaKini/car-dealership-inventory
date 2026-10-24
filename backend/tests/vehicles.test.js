const request = require('supertest');
const { createTestContext, loginAs, bearer, sampleVehicle } = require('./helpers');

describe('Vehicles API', () => {
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

  beforeEach(async () => {
    context = createTestContext();
    userToken = await loginAs(context, { email: 'user@example.com' });
    adminToken = await loginAs(context, { email: 'admin@example.com', role: 'admin' });
  });

  afterEach(() => {
    context.close();
  });

  describe('POST /api/vehicles', () => {
    it('adds a vehicle with a unique id', async () => {
      const first = await request(context.app)
        .post('/api/vehicles')
        .set(bearer(userToken))
        .send(sampleVehicle());
      const second = await request(context.app)
        .post('/api/vehicles')
        .set(bearer(userToken))
        .send(sampleVehicle({ model: 'Camry' }));

      expect(first.status).toBe(201);
      expect(first.body).toMatchObject(sampleVehicle());
      expect(second.body.id).not.toBe(first.body.id);
    });

    it('trims text fields', async () => {
      const response = await request(context.app)
        .post('/api/vehicles')
        .set(bearer(userToken))
        .send(sampleVehicle({ make: '  Honda  ' }));

      expect(response.body.make).toBe('Honda');
    });

    it.each([
      ['a missing make', { make: undefined }],
      ['an empty model', { model: '   ' }],
      ['a missing category', { category: undefined }],
      ['a negative price', { price: -1 }],
      ['a non-numeric price', { price: '20000' }],
      ['a missing quantity', { quantity: undefined }],
      ['a fractional quantity', { quantity: 1.5 }],
      ['a negative quantity', { quantity: -3 }],
      ['an over-long make', { make: 'x'.repeat(101) }],
    ])('rejects %s with 400', async (_label, overrides) => {
      const response = await request(context.app)
        .post('/api/vehicles')
        .set(bearer(userToken))
        .send(sampleVehicle(overrides));

      expect(response.status).toBe(400);
    });

    it('rejects a request without a body with 400', async () => {
      const response = await request(context.app).post('/api/vehicles').set(bearer(userToken));

      expect(response.status).toBe(400);
    });

    it('rejects unauthenticated requests with 401', async () => {
      const response = await request(context.app).post('/api/vehicles').send(sampleVehicle());

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vehicles', () => {
    it('returns an empty list when nothing has been added', async () => {
      const response = await request(context.app).get('/api/vehicles').set(bearer(userToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns every vehicle, including those out of stock', async () => {
      await addVehicle();
      await addVehicle({ model: 'Camry', quantity: 0 });

      const response = await request(context.app).get('/api/vehicles').set(bearer(userToken));

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/vehicles/search', () => {
    beforeEach(async () => {
      await addVehicle({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000 });
      await addVehicle({ make: 'Toyota', model: 'RAV4', category: 'SUV', price: 30000 });
      await addVehicle({ make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000, quantity: 0 });
    });

    const search = (query) =>
      request(context.app).get('/api/vehicles/search').query(query).set(bearer(userToken));

    it('returns all vehicles when no filter is given', async () => {
      const response = await search({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });

    it('filters by make, case-insensitively and partially', async () => {
      const response = await search({ make: 'toyo' });

      expect(response.body.map((v) => v.model)).toEqual(['Corolla', 'RAV4']);
    });

    it('filters by model', async () => {
      const response = await search({ model: 'civ' });

      expect(response.body.map((v) => v.make)).toEqual(['Honda']);
    });

    it('filters by category, case-insensitively', async () => {
      const response = await search({ category: 'suv' });

      expect(response.body.map((v) => v.model)).toEqual(['RAV4']);
    });

    it('filters by an inclusive price range', async () => {
      const response = await search({ minPrice: 22000, maxPrice: 30000 });

      expect(response.body.map((v) => v.model)).toEqual(['RAV4', 'Civic']);
    });

    it('filters by minPrice only', async () => {
      const response = await search({ minPrice: 25000 });

      expect(response.body.map((v) => v.model)).toEqual(['RAV4']);
    });

    it('filters by maxPrice only', async () => {
      const response = await search({ maxPrice: 20000 });

      expect(response.body.map((v) => v.model)).toEqual(['Corolla']);
    });

    it('combines filters', async () => {
      const response = await search({ make: 'Toyota', category: 'Sedan' });

      expect(response.body.map((v) => v.model)).toEqual(['Corolla']);
    });

    it('returns an empty list when nothing matches', async () => {
      const response = await search({ make: 'Ferrari' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('treats SQL wildcards in input literally', async () => {
      const response = await search({ make: '%' });

      expect(response.body).toEqual([]);
    });

    it('ignores blank filters', async () => {
      const response = await search({ make: '  ', minPrice: '' });

      expect(response.body).toHaveLength(3);
    });

    it.each([
      ['a non-numeric minPrice', { minPrice: 'abc' }],
      ['a negative maxPrice', { maxPrice: -5 }],
      ['minPrice greater than maxPrice', { minPrice: 5000, maxPrice: 1000 }],
      ['a repeated make parameter', 'make=a&make=b'],
    ])('rejects %s with 400', async (_label, query) => {
      const response = await search(query);

      expect(response.status).toBe(400);
    });

    it('requires authentication', async () => {
      const response = await request(context.app).get('/api/vehicles/search');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('updates the supplied fields and keeps the rest', async () => {
      const vehicle = await addVehicle();

      const response = await request(context.app)
        .put(`/api/vehicles/${vehicle.id}`)
        .set(bearer(userToken))
        .send({ price: 18500, category: 'Hatchback' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: vehicle.id,
        make: 'Toyota',
        model: 'Corolla',
        category: 'Hatchback',
        price: 18500,
        quantity: 5,
      });
    });

    it('returns 404 for an unknown vehicle', async () => {
      const response = await request(context.app)
        .put('/api/vehicles/999')
        .set(bearer(userToken))
        .send({ price: 1 });

      expect(response.status).toBe(404);
    });

    it('returns 400 for an invalid id', async () => {
      const response = await request(context.app)
        .put('/api/vehicles/abc')
        .set(bearer(userToken))
        .send({ price: 1 });

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid data', async () => {
      const vehicle = await addVehicle();

      const response = await request(context.app)
        .put(`/api/vehicles/${vehicle.id}`)
        .set(bearer(userToken))
        .send({ price: -10 });

      expect(response.status).toBe(400);
    });

    it('returns 400 when no updatable field is provided', async () => {
      const vehicle = await addVehicle();

      const response = await request(context.app)
        .put(`/api/vehicles/${vehicle.id}`)
        .set(bearer(userToken))
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('lets an admin delete a vehicle', async () => {
      const vehicle = await addVehicle();

      const response = await request(context.app)
        .delete(`/api/vehicles/${vehicle.id}`)
        .set(bearer(adminToken));
      const list = await request(context.app).get('/api/vehicles').set(bearer(adminToken));

      expect(response.status).toBe(204);
      expect(list.body).toEqual([]);
    });

    it('forbids a regular user with 403', async () => {
      const vehicle = await addVehicle();

      const response = await request(context.app)
        .delete(`/api/vehicles/${vehicle.id}`)
        .set(bearer(userToken));

      expect(response.status).toBe(403);
    });

    it('returns 404 for an unknown vehicle', async () => {
      const response = await request(context.app).delete('/api/vehicles/999').set(bearer(adminToken));

      expect(response.status).toBe(404);
    });

    it('returns 401 without a token', async () => {
      const response = await request(context.app).delete('/api/vehicles/1');

      expect(response.status).toBe(401);
    });
  });
});
