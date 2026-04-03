const config = require('../config/env');

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const perPage = Math.min(
    config.maxPageSize,
    Math.max(1, parseInt(query.per_page || String(config.defaultPageSize), 10) || config.defaultPageSize)
  );
  return {
    page,
    perPage,
    limit: perPage,
    offset: (page - 1) * perPage,
  };
}

function buildMeta(page, perPage, total) {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  };
}

module.exports = { parsePagination, buildMeta };
