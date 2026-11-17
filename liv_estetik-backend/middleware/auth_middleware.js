const { verifyAuthToken } = require("../util/tokens");
const ApiError = require("../util/api_error");
const User = require("../models/user");
const Role = require("../models/role");
const { BUILTIN_ROLES, DEFAULT_ROLE_PERMISSIONS } = require("../service/permissions");
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

  let roleName = user.role;
  let permissions = DEFAULT_ROLE_PERMISSIONS[user.role];
  if (!BUILTIN_ROLES.includes(user.role)) {
    const role = await Role.findOne({ key: user.role, active: true }).select("name permissions").lean();
    if (!role) throw ApiError.forbidden("This account role is inactive or no longer available.");
    roleName = role.name;
    permissions = role.permissions;
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    roleName,
    permissions,
    requestId: req.requestId,
  };

  next();
});

module.exports = { requireAuth };
