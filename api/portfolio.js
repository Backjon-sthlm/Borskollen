const { getQuote } = require('./_utils');

const PORTFOLIO = [
  { ticker: 'EKTA-B.ST', name: 'Elekta B',  bought: 56.25,  shares: 35 },
  { ticker: 'GRNG.ST',   name: 'Gränges',   bought: 170.90, shares: 7  },
  { ticker: 'KNOW.ST',   name: 'Knowit',    bought: 80.40,  shares: 25 },
];

const WATCHLIST = [
  { ticker: 'EGTX.ST', name: 'Egetis Therapeutics', bought: 11.79, shares: null, note: 'Långsiktigt – FDA sep 2026' },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const allHoldings = [...PORTFOLIO, ...WATCHLIST];
    const quotes = await Promise.all(allHoldings.map(h => getQuote(h.ticker)));

    let totalInvested = 0, totalValue = 0, totalPrevValue = 0;

    const portfolio = PORTFOLIO.map((h, i) => {
      const q = quotes[i];
      if (!q) return { ...h, error: true };
      const value = +(q.price * h.shares).toFixed(0);
      const prevValue = q.prevClose ? +(q.prevClose * h.shares).toFixed(0) : value;
      const pnlKr = +((q.price - h.bought) * h.shares).toFixed(0);
      const pnlPct = +((q.price - h.bought) / h.bought * 100).toFixed(2);
      totalInvested += h.bought * h.shares;
      totalValue += value;
      totalPrevValue += prevValue;
      return {
        ticker: h.ticker, name: h.name,
        price: q.price, dayChange_pct: q.dayChange_pct, dayChange_kr: q.dayChange_kr,
        bought: h.bought, shares: h.shares,
        pnl_pct: pnlPct, pnl_kr: pnlKr, value,
        high: q.high, low: q.low, volume: q.volume,
      };
    });

    const watchlist = WATCHLIST.map((h, i) => {
      const q = quotes[PORTFOLIO.length + i];
      if (!q) return { ...h, error: true };
      return {
        ticker: h.ticker, name: h.name, price: q.price,
        dayChange_pct: q.dayChange_pct, bought: h.bought,
        pnl_pct: +((q.price - h.bought) / h.bought * 100).toFixed(2),
        note: h.note,
      };
    });

    const totalPnlKr = +(totalValue - totalInvested).toFixed(0);
    const totalPnlPct = +((totalValue - totalInvested) / totalInvested * 100).toFixed(2);
    const todayPnlKr = +(totalValue - totalPrevValue).toFixed(0);
    const todayPnlPct = totalPrevValue ? +((totalValue - totalPrevValue) / totalPrevValue * 100).toFixed(2) : 0;

    res.status(200).json({
      generated: new Date().toISOString(),
      summary: { totalInvested: +totalInvested.toFixed(0), totalValue: +totalValue.toFixed(0), totalPnl_kr: totalPnlKr, totalPnl_pct: totalPnlPct, todayPnl_kr: todayPnlKr, todayPnl_pct: todayPnlPct },
      portfolio,
      watchlist,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
