const express = require('express');

/** Vehicle and inventory endpoints. Every route requires a valid token. */
function createVehicleRoutes(vehicleService, { authenticate, requireAdmin }) {
  const router = express.Router();
  router.use(authenticate);

  router.get('/', (req, res) => {
    res.json(vehicleService.list());
  });

  // Declared before '/:id' routes so "search" is never treated as an id.
  router.get('/search', (req, res) => {
    res.json(vehicleService.search(req.query));
  });

  router.post('/', (req, res) => {
    res.status(201).json(vehicleService.create(req.body));
  });

  router.put('/:id', (req, res) => {
    res.json(vehicleService.update(req.params.id, req.body));
  });

  router.delete('/:id', requireAdmin, (req, res) => {
    vehicleService.remove(req.params.id);
    res.status(204).end();
  });

  router.post('/:id/purchase', (req, res) => {
    res.json(vehicleService.purchase(req.params.id, req.body?.quantity));
  });

  router.post('/:id/restock', requireAdmin, (req, res) => {
    res.json(vehicleService.restock(req.params.id, req.body?.quantity));
  });

  return router;
}

module.exports = createVehicleRoutes;
