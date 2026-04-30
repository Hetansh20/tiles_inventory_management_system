const AuditLog = require('../models/auditLog');

/**
 * Logs an action to the AuditLog collection.
 * @param {string} userId - The ID of the user performing the action
 * @param {string} moduleName - The name of the module (e.g., 'Users', 'Products')
 * @param {string} action - 'CREATE', 'UPDATE', or 'DELETE'
 * @param {string} targetId - The ID of the document being modified
 * @param {Object} beforeState - The document state before the action (null for CREATE)
 * @param {Object} afterState - The document state after the action (null for DELETE)
 * @param {Object} [session] - Optional mongoose session for transactions
 */
const logAction = async (userId, moduleName, action, targetId, beforeState = null, afterState = null, session = null) => {
  try {
    const logEntry = new AuditLog({
      user: userId,
      module: moduleName,
      action: action,
      targetId: targetId,
      beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
      afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : null
    });

    if (session) {
      await logEntry.save({ session });
    } else {
      await logEntry.save();
    }
  } catch (error) {
    console.error(`[Audit Log Error] Failed to log ${action} on ${moduleName}:`, error.message);
    // We intentionally don't throw to avoid breaking the main application flow if logging fails, 
    // but in a strict compliance environment, you might want to throw here.
  }
};

module.exports = {
  logAction
};
