const fs = require('fs');
const path = require('path');
const { getDb, closeDb } = require('./client');

function runMigrations() {
  const db = getDb();
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      db.exec(sql);
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      console.error(`Migration failed: ${file}`, err.message);
      throw err;
    }
  }
  console.log('All migrations complete.');
}

if (require.main === module) {
  try {
    runMigrations();
  } finally {
    closeDb();
  }
}

module.exports = { runMigrations };
