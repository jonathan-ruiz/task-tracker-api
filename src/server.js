const app = require('./app');
const { runMigrations } = require('./db/migrate');
const config = require('./config/env');

runMigrations();

app.listen(config.port, () => {
  console.log(`Task Tracker API listening on port ${config.port}`);
});
