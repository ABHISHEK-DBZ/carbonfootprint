const { calculateTotal } = require('../backend/lib/emissionEngine');
const { validateFootprintInput } = require('../backend/lib/validate');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { valid, errors } = validateFootprintInput(req.body);
  if (!valid) return res.status(400).json({ error: 'Invalid input', details: errors });

  const result = calculateTotal(req.body);
  res.status(200).json(result);
};
