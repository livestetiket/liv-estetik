const AuditLog = require("../models/audit_log");

/**
 * Records a sensitive dashboard action for accountability/debugging.
 * Never throws — audit logging failures must not break the primary action.
 */
async function logAction({ actor, action, entityType, entityId, metadata }) {
  try {
    const scrub = (value) => {
      if (!value || typeof value !== "object") return value;
      if (Array.isArray(value)) return value.map(scrub);
      return Object.fromEntries(Object.entries(value)
        .filter(([key]) => !/(password|token|secret|credential|authorization)/i.test(key))
        .map(([key, item]) => [key, scrub(item)]));
    };
    await AuditLog.create({
      actor: actor?.id || undefined,
      actorName: actor?.name || actor?.email || (actor?.role === "public" ? "Public visitor" : "System"),
      actorRole: actor?.role || "system",
      action,
      entityType,
      entityId,
      metadata: scrub(metadata),
      requestId: actor?.requestId,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] Failed to write audit log:", err.message);
  }
}

module.exports = { logAction };
