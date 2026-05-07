const { getQuote } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const ticker = req.query.ticker || req.query.t;
  if (!ticker) {
    return res.status(400).json({ error: 'Saknar ticker. Exempel: /api/quote?ticker=VOLV-B' });
  }

  try {
    const q = await getQuote(ticker);
    if (!q) return res.status(404).json({ error: `Hittade inte: ${ticker}` });
    res.status(200).json({ generated: new Date().toISOString(), ...q });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
