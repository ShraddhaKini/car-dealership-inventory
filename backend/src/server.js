const config = require('./config');
const { createDatabase } = require('./database');
const { createApp } = require('./app');

const db = createDatabase(config.databasePath);
const app = createApp({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
});

app.listen(config.port, () => {
  console.log(`Dealership API listening on http://localhost:${config.port}`);
});
