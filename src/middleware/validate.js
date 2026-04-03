function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(data);
    if (!result.success) {
      const details = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details,
        },
      });
    }
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req.validatedBody = result.data;
    }
    next();
  };
}

module.exports = { validate };
