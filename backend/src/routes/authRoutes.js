const express = require('express');

/** POST /register and POST /login */
function createAuthRoutes(authService) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const user = await authService.register({
      email: req.body?.email,
      password: req.body?.password,
    });
    res.status(201).json({ user });
  });

  router.post('/login', async (req, res) => {
    res.json(await authService.login(req.body));
  });

  return router;
}

module.exports = createAuthRoutes;
