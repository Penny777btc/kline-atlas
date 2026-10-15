// Vercel serverless proxy for Binance public kline data (no API key needed).
// GET /api/klines?symbol=BTCUSDT&interval=1d&limit=500
const SYMBOLS = new Set(['BTCUSDT', 'ETHUSDT']);
const INTERVALS = new Set(['1m', '5m', '15m', '1h', '4h', '1d', '1w']);
const UPSTREAMS = ['https://data-api.binance.vision', 'https://api.binance.com'];

module.exports = async (req, res) => {
  const { symbol = 'BTCUSDT', interval = '1d' } = req.query || {};
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit || '500', 10) || 500));
  if (!SYMBOLS.has(symbol) || !INTERVALS.has(interval)) {
    res.status(400).json({ error: 'unsupported symbol or interval' });
    return;
  }
  const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  let lastErr = 'upstream unavailable';
  for (const base of UPSTREAMS) {
    try {
      const r = await fetch(base + path, { headers: { accept: 'application/json' } });
      if (!r.ok) { lastErr = `${base} ${r.status}`; continue; }
      const data = await r.json();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
      res.status(200).json(data);
      return;
    } catch (e) { lastErr = String(e); }
  }
  res.status(502).json({ error: lastErr });
};
