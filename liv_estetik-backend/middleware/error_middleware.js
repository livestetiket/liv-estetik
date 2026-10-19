const ApiError = require("../util/api_error");

// 404 handler for unmatched routes.
function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Final error handler. Never leaks stack traces or internals to clients.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
    details = err.keyValue;
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field "${err.path}"`;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error] Request failed with an internal error.");
  }

  res.status(statusCode).json({
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
