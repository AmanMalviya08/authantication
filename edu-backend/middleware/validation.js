const Validator = require('fastest-validator');
const v = new Validator();

/**
 * Middleware to validate request body against schema
 * @param {Object} schema - Validation schema using fastest-validator format
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const check = v.compile(schema);
    const result = check(req.body);

    if (result === true) {
      return next();
    } else {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.map(err => ({
          field: err.field,
          message: err.message
        })),
      });
    }
  };
};

module.exports = {
  validateRequest,
};
