const { isValidAnonymousId } = require('../backend/lib/validate');

// In-memory store (resets on cold start — fine for demo)
const store = new Map();

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/track?id=xxx
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id || !isValidAnonymousId(id)) {
      return res.status(400).json({ error: 'Valid anonymousId required' });
    }
    return res.status(200).json({ entries: store.get(id) || [] });
  }

  // POST /api/track
  if (req.method === 'POST') {
    const { anonymousId, totals } = req.body || {};
    if (!anonymousId || !isValidAnonymousId(anonymousId)) {
      return res.status(400).json({ error: 'anonymousId must be a valid UUID v4' });
    }
    if (!totals || typeof totals.totalTonnesPerYear !== 'number') {
      return res.status(400).json({ error: 'totals.totalTonnesPerYear (number) required' });
    }

    const entries = store.get(anonymousId) || [];
    entries.push({
      timestamp: new Date().toISOString(),
      totalTonnesPerYear: totals.totalTonnesPerYear,
      breakdown: totals.breakdown || null
    });
    store.set(anonymousId, entries);

    return res.status(201).json({ entriesStored: entries.length });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
