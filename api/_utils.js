const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function getQuote(ticker) {
  try {
    const t = ticker.includes('.') ? ticker : ticker + '.ST';
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=2d`;
    const data = await fetchJSON(url);
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const prevClose = meta.previousClose || meta.chartPreviousClose;
    const price = meta.regularMarketPrice;
    const dayChangePct = prevClose ? +((price - prevClose) / prevClose * 100).toFixed(2) : null;
    return {
      ticker: t,
      name: meta.longName || meta.shortName || t,
      price: +price.toFixed(2),
      prevClose: prevClose ? +prevClose.toFixed(2) : null,
      open: meta.regularMarketOpen ? +meta.regularMarketOpen.toFixed(2) : null,
      high: meta.regularMarketDayHigh ? +meta.regularMarketDayHigh.toFixed(2) : null,
      low: meta.regularMarketDayLow ? +meta.regularMarketDayLow.toFixed(2) : null,
      volume: meta.regularMarketVolume || null,
      currency: meta.currency || 'SEK',
      dayChange_pct: dayChangePct,
      dayChange_kr: prevClose ? +(price - prevClose).toFixed(2) : null,
      marketState: meta.marketState || null,
    };
  } catch(e) {
    return null;
  }
}

module.exports = { getQuote };
