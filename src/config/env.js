require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.NODE_ENV === 'test'
    ? (process.env.TEST_DB_PATH || ':memory:')
    : (process.env.DB_PATH || './data/tasks.db'),
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
};
