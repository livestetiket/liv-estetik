const { verifyAuthToken } = require("../util/tokens");
const ApiError = require("../util/api_error");
const User = require("../models/user");
const asyncHandler = require("../util/async_handler");

/**
 * Requires a valid JWT for a reception/admin user.
 * Populates req.user with { id, role, name, email }.
 */
const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Missing or invalid authorization header");
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) {
    throw ApiError.unauthorized("Account no longer has access");
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  };

  next();
});

module.exports = { requireAuth };