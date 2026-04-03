const { parsePagination, buildMeta } = require('../../src/utils/pagination');

describe('parsePagination', () => {
  it('returns defaults when no query params', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(20);
  });

  it('parses page and per_page correctly', () => {
    const result = parsePagination({ page: '3', per_page: '10' });
    expect(result.page).toBe(3);
    expect(result.perPage).toBe(10);
    expect(result.offset).toBe(20);
    expect(result.limit).toBe(10);
  });

  it('caps per_page at max (100)', () => {
    const result = parsePagination({ per_page: '500' });
    expect(result.perPage).toBe(100);
  });

  it('clamps page to minimum of 1', () => {
    const result = parsePagination({ page: '-5' });
    expect(result.page).toBe(1);
  });

  it('handles non-numeric values gracefully', () => {
    const result = parsePagination({ page: 'abc', per_page: 'xyz' });
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });
});

describe('buildMeta', () => {
  it('calculates total_pages correctly', () => {
    const meta = buildMeta(1, 20, 45);
    expect(meta.total_pages).toBe(3);
    expect(meta.total).toBe(45);
    expect(meta.page).toBe(1);
    expect(meta.per_page).toBe(20);
  });

  it('handles zero total', () => {
    const meta = buildMeta(1, 20, 0);
    expect(meta.total_pages).toBe(0);
    expect(meta.total).toBe(0);
  });

  it('handles exact divisor', () => {
    const meta = buildMeta(2, 10, 20);
    expect(meta.total_pages).toBe(2);
  });
});
