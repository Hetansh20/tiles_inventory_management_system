const { query } = require('../config/db');
const { createId } = require('../utils/sqlHelpers');

const serializeState = (state) => (state ? JSON.stringify(state) : null);

/**
 * Logs an action to the append-only audit_logs table.
 */
const logAction = async (userId, moduleName, action, targetId, beforeState = null, afterState = null, connection = null) => {
  try {
    const executor = connection || { execute: query };
    const sql = `
      INSERT INTO audit_logs (id, user_id, module_name, action, target_id, before_state, after_state)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      createId(),
      userId || null,
      moduleName,
      action,
      targetId,
      serializeState(beforeState),
      serializeState(afterState)
    ];

    if (connection) {
      await executor.execute(sql, params);
    } else {
      await query(sql, params);
    }
  } catch (error) {
    console.error(`[Audit Log Error] Failed to log ${action} on ${moduleName}:`, error.message);
  }
};

module.exports = {
  logAction
};
