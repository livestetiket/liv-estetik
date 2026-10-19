const ApiError = require("../util/api_error");

/**
 * Validates req.body against a Zod schema. On success, replaces req.body
 * with the parsed (and coerced/defaulted) value.
 */
function validateBody(schema) {
  return function validator(req, _res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(ApiError.badRequest("Validation failed", details));
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
