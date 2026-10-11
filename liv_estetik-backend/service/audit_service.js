const AuditLog = require("../models/audit_log");

/**
 * Records a sensitive dashboard action for accountability/debugging.
 * Never throws — audit logging failures must not break the primary action.
 */
async function logAction({ actor, action, entityType, entityId, metadata }) {
  try {
    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] Failed to write audit log:", err.message);
  }
}

module.exports = { logAction };