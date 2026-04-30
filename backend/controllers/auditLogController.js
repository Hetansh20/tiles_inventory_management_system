const AuditLog = require('../models/auditLog');

const getAuditLogs = async (req, res) => {
  try {
    const { module, user, startDate, endDate } = req.query;
    
    // Build filter query
    const query = {};
    if (module && module !== 'all') query.module = module;
    if (user && user !== 'all') query.user = user;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(500); // Prevent massive payloads, admin can filter down

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAuditLogs
};
