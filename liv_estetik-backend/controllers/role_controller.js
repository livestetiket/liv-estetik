const Role = require("../models/role");
const User = require("../models/user");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const { logAction } = require("../service/audit_service");
const { BUILTIN_ROLES, DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } = require("../service/permissions");
const { notifyRoles } = require("../service/notification_service");

const permissionLabels = PERMISSIONS.map((key) => ({ key, label: key.replaceAll(".", " · ").replaceAll("_", " ") }));
const adminOnly = (req) => { if (req.user.role !== "admin") throw ApiError.forbidden("Role management is restricted to Admin users."); };

const listRoles = asyncHandler(async (_req, res) => {
  adminOnly(_req);
  const [custom, users] = await Promise.all([Role.find().sort({ name: 1 }).lean(), User.find().select("name email role").lean()]);
  const builtIns = BUILTIN_ROLES.map((key) => ({ key, name: key === "call_center_agent" ? "Call Center Agent" : key[0].toUpperCase() + key.slice(1), description: "Protected system role", permissions: DEFAULT_ROLE_PERMISSIONS[key], active: true, system: true }));
  const rows = [...builtIns, ...custom.map((role) => ({ ...role, system: false }))].map((role) => ({ ...role, userCount: users.filter((user) => user.role === role.key).length, users: users.filter((user) => user.role === role.key).map(({ name, email }) => ({ name, email })) }));
  res.json({ data: { roles: rows, permissions: permissionLabels } });
});

const createRole = asyncHandler(async (req, res) => {
  adminOnly(req);
  const key = req.body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!key || BUILTIN_ROLES.includes(key)) throw ApiError.conflict("That role name is reserved for a system role.");
  if (await Role.exists({ key })) throw ApiError.conflict("A role with that name already exists.");
  const role = await Role.create({ ...req.body, key });
  await logAction({ actor: req.user, action: "role.created", entityType: "Role", entityId: role._id, metadata: { key, permissions: role.permissions } });
  await notifyRoles({ roles: ["admin"], eventKey: `admin.role-created:${role._id}`, eventType: "admin.role_changed", title: "Custom role created", message: `${role.name} was added to Role Management.`, entityType: "Role", entityId: role._id });
  res.status(201).json({ data: role });
});

const updateRole = asyncHandler(async (req, res) => {
  adminOnly(req);
  if (BUILTIN_ROLES.includes(req.params.key)) throw ApiError.forbidden("System roles cannot be edited here.");
  const role = await Role.findOne({ key: req.params.key });
  if (!role) throw ApiError.notFound("Role not found");
  if (req.body.active === false && await User.exists({ role: role.key, active: true })) throw ApiError.conflict("Reassign or deactivate users with this role before deactivating it.");
  const previous = { name: role.name, description: role.description, permissions: role.permissions, active: role.active };
  Object.assign(role, req.body);
  await role.save();
  await logAction({ actor: req.user, action: "role.permissions_changed", entityType: "Role", entityId: role._id, metadata: { previous, updated: { name: role.name, description: role.description, permissions: role.permissions, active: role.active } } });
  await notifyRoles({ roles: ["admin"], eventKey: `admin.role-updated:${role._id}:${role.updatedAt.getTime()}`, eventType: "admin.role_changed", title: "Custom role changed", message: `Permissions or availability changed for ${role.name}.`, entityType: "Role", entityId: role._id });
  res.json({ data: role });
});

module.exports = { listRoles, createRole, updateRole };
