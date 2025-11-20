const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { syncOnce } = require('../services/acmSyncService');

// Manual trigger for ACM sync
// Protected: only authenticated organizers may trigger manual syncs
router.post('/sync', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'organizer') {
      return res.status(403).json({ ok: false, message: 'Organizer role required' });
    }

    const result = await syncOnce();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || 'Sync failed' });
  }
});

module.exports = router;
