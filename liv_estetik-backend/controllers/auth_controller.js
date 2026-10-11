const bcrypt = require("bcryptjs");
const User = require("../models/user");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const { signAuthToken } = require("../util/tokens");
const { logAction } = require("../service/audit_service");

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.active) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken(user);

  await logAction({
    actor: { id: user._id.toString(), role: user.role },
    action: "auth.login",
    entityType: "User",
    entityId: user._id,
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  res.json({ data: user });
});

// POST /api/auth/change-email
const changeEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if email is already in use by another user
  const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
  if (existing) {
    throw ApiError.conflict("This email is already in use");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const oldEmail = user.email;
  user.email = email.toLowerCase();
  await user.save();

  await logAction({
    actor: req.user,
    action: "account.email_changed",
    entityType: "User",
    entityId: user._id,
    metadata: { oldEmail, newEmail: user.email },
  });

  res.json({
    message: "Email updated successfully",
    data: user,
  });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  // Hash and update new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await logAction({
    actor: req.user,
    action: "account.password_changed",
    entityType: "User",
    entityId: user._id,
  });

  res.json({
    message: "Password updated successfully",
    data: user,
  });
});

module.exports = { login, me, changeEmail, changePassword };